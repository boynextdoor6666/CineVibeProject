import os
import json
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler, MultiLabelBinarizer
from dotenv import load_dotenv

# Load environment variables
basedir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(basedir, '../../movie-aggregator-backend-nest/.env')
load_dotenv(env_path)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASS', '')
DB_NAME = os.getenv('DB_NAME', 'warehouse')

# Connect to Database
db_url = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(db_url)

def update_ml_status(task_name, status, progress, message):
    """Updates the ML task status in the database to make the progress visible."""
    try:
        with engine.begin() as conn:
            # Create table if not exists (usually better done in migrations, but safe here)
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS ml_task_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    task_name VARCHAR(255) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    progress INT DEFAULT 0,
                    message TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_task (task_name)
                )
            """))
            
            # Upsert status
            conn.execute(text("""
                INSERT INTO ml_task_logs (task_name, status, progress, message)
                VALUES (:task_name, :status, :progress, :message)
                ON DUPLICATE KEY UPDATE 
                    status = VALUES(status),
                    progress = VALUES(progress),
                    message = VALUES(message)
            """), {"task_name": task_name, "status": status, "progress": progress, "message": message})
    except Exception as e:
        print(f"Failed to update ML status: {e}")

def parse_json_feature(json_data, keys):
    """Parses JSON string or dict and extracts specific keys as a vector."""
    if not json_data:
        return [0] * len(keys)
    
    if isinstance(json_data, str):
        try:
            data = json.loads(json_data)
        except:
            return [0] * len(keys)
    else:
        data = json_data
        
    return [float(data.get(k, 0)) for k in keys]

def train_recommender():
    print("🚀 Starting Hybrid ML Recommendation Engine...")
    update_ml_status("Hybrid Recommender", "running", 5, "Starting Hybrid ML Recommendation Engine...")

    # ---------------------------------------------------------
    # 1. Fetch Data
    # ---------------------------------------------------------
    print("📥 Fetching data from database...")
    update_ml_status("Hybrid Recommender", "running", 10, "Fetching data from database...")
    
    # Fetch Reviews
    reviews_query = "SELECT user_id, content_id, rating FROM reviews WHERE rating IS NOT NULL"
    reviews_df = pd.read_sql(reviews_query, engine)
    
    # Fetch Content Features
    content_query = "SELECT id, title, genre, emotional_cloud, perception_map, hype_index, avg_rating FROM content"
    content_df = pd.read_sql(content_query, engine)
    
    if content_df.empty:
        print("⚠️ No content found. Exiting.")
        update_ml_status("Hybrid Recommender", "failed", 0, "No content found. Exiting.")
        return

    print(f"📊 Loaded {len(reviews_df)} reviews and {len(content_df)} content items.")
    update_ml_status("Hybrid Recommender", "running", 20, f"Loaded {len(reviews_df)} reviews and {len(content_df)} content items.")

    # ---------------------------------------------------------
    # 2. Content-Based Filtering (Feature Engineering)
    # ---------------------------------------------------------
    print("🧠 Building Content-Based Model...")
    update_ml_status("Hybrid Recommender", "running", 30, "Building Content-Based Model...")
    
    # A. Genre Features
    content_df['genre_list'] = content_df['genre'].apply(lambda x: [g.strip() for g in x.split(',')] if x else [])
    mlb = MultiLabelBinarizer()
    genre_matrix = mlb.fit_transform(content_df['genre_list'])
    
    # B. Emotional Features
    emotion_keys = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'anticipation', 'trust', 'awe', 'tension', 'excitement']
    content_df['emotions_vec'] = content_df['emotional_cloud'].apply(lambda x: parse_json_feature(x, emotion_keys))
    emotion_matrix = np.array(content_df['emotions_vec'].tolist())
    
    # Normalize emotions (0-1)
    scaler = MinMaxScaler()
    if emotion_matrix.shape[0] > 0:
        emotion_matrix = scaler.fit_transform(emotion_matrix)

    # C. Perception Features
    perception_keys = ['plot', 'acting', 'visuals', 'soundtrack', 'originality', 'pacing', 'atmosphere']
    content_df['perception_vec'] = content_df['perception_map'].apply(lambda x: parse_json_feature(x, perception_keys))
    perception_matrix = np.array(content_df['perception_vec'].tolist())
    
    if perception_matrix.shape[0] > 0:
        perception_matrix = scaler.fit_transform(perception_matrix)

    # Combine Features: Genre (0.3) + Emotions (0.4) + Perception (0.3)
    # We concatenate them and let cosine similarity handle it, but weighting helps.
    # Let's just concatenate for now, assuming equal importance of dimensions, 
    # but since genre is sparse binary and others are dense continuous, we might want to weight them.
    
    # Simple concatenation
    content_features = np.hstack([genre_matrix, emotion_matrix, perception_matrix])
    
    # Compute Content Similarity Matrix
    content_sim_matrix = cosine_similarity(content_features)
    content_sim_df = pd.DataFrame(content_sim_matrix, index=content_df['id'], columns=content_df['id'])
    
    print("✅ Content-Based Similarity calculated.")
    update_ml_status("Hybrid Recommender", "running", 50, "Content-Based Similarity calculated.")

    # ---------------------------------------------------------
    # 3. Collaborative Filtering (Item-Item)
    # ---------------------------------------------------------
    print("🤝 Building Collaborative Filtering Model...")
    update_ml_status("Hybrid Recommender", "running", 60, "Building Collaborative Filtering Model...")
    
    collab_sim_df = pd.DataFrame(0, index=content_df['id'], columns=content_df['id'])
    
    if not reviews_df.empty:
        # Create User-Item Matrix
        user_item_matrix = reviews_df.pivot_table(index='user_id', columns='content_id', values='rating').fillna(0)
        
        # Align with all content IDs (fill missing items with 0)
        # This ensures the matrix has all items even if not rated
        all_content_ids = content_df['id'].unique()
        user_item_matrix = user_item_matrix.reindex(columns=all_content_ids, fill_value=0)
        
        # Compute Item-Item Similarity
        # Transpose to get Item-User matrix
        item_user_matrix = user_item_matrix.T
        collab_sim_matrix = cosine_similarity(item_user_matrix)
        collab_sim_df = pd.DataFrame(collab_sim_matrix, index=item_user_matrix.index, columns=item_user_matrix.index)
        
        print("✅ Collaborative Similarity calculated.")
        update_ml_status("Hybrid Recommender", "running", 70, "Collaborative Similarity calculated.")
    else:
        print("⚠️ No reviews yet. Using pure Content-Based Filtering.")
        update_ml_status("Hybrid Recommender", "running", 70, "No reviews yet. Using pure Content-Based Filtering.")

    # ---------------------------------------------------------
    # 4. Hybridization
    # ---------------------------------------------------------
    print("DNA Combining Models (Hybrid Approach)...")
    update_ml_status("Hybrid Recommender", "running", 80, "Combining Models (Hybrid Approach)...")
    
    # Hybrid Weight: 70% Collaborative (if available), 30% Content
    # If no reviews, 100% Content
    alpha = 0.7 if not reviews_df.empty else 0.0
    
    # Ensure indices match
    hybrid_sim_df = alpha * collab_sim_df + (1 - alpha) * content_sim_df
    
    # ---------------------------------------------------------
    # 5. Generate Recommendations
    # ---------------------------------------------------------
    print("🔮 Generating Recommendations...")
    update_ml_status("Hybrid Recommender", "running", 90, "Generating Recommendations...")
    
    recommendations = []
    
    # Get all users (including those who might not have reviews if we had a users table, 
    # but here we only iterate over users who have reviews. 
    # For new users, we should have a separate 'popular' strategy or handle them in the API request)
    
    # We will generate recommendations for all users found in reviews
    unique_users = reviews_df['user_id'].unique() if not reviews_df.empty else []
    
    for user_id in unique_users:
        # Get items user has rated
        user_ratings = reviews_df[reviews_df['user_id'] == user_id]
        rated_items = dict(zip(user_ratings['content_id'], user_ratings['rating']))
        
        scores = {}
        
        # For every item in the catalog
        for item_id in content_df['id']:
            if item_id in rated_items:
                continue # Skip already seen
            
            # Calculate score based on similarity to rated items
            weighted_sum = 0
            similarity_sum = 0
            
            for rated_item_id, rating in rated_items.items():
                if rated_item_id not in hybrid_sim_df.index:
                    continue
                    
                sim = hybrid_sim_df.loc[item_id, rated_item_id]
                
                # Only consider positive similarities
                if sim > 0.1: 
                    weighted_sum += sim * rating
                    similarity_sum += sim
            
            if similarity_sum > 0:
                predicted_score = weighted_sum / similarity_sum
                scores[item_id] = predicted_score
            else:
                # Fallback to content popularity/hype if no similarity found
                # (This helps with serendipity)
                scores[item_id] = 0
        
        # Top 20
        top_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:20]
        
        for item_id, score in top_items:
            recommendations.append({
                'user_id': user_id,
                'content_id': item_id,
                'score': score,
                'reason': 'На основе ваших предпочтений'
            })

    # ---------------------------------------------------------
    # 6. Save to Database
    # ---------------------------------------------------------
    if recommendations:
        print(f"💾 Saving {len(recommendations)} recommendations to database...")
        update_ml_status("Hybrid Recommender", "running", 95, f"Saving {len(recommendations)} recommendations to database...")
        
        recs_df = pd.DataFrame(recommendations)
        
        # Add an ID column to match NestJS entity
        recs_df['id'] = range(1, len(recs_df) + 1)

        # Use 'replace' to handle schema changes (e.g. adding 'reason' column)
        # Note: This drops Foreign Keys, but for a read-heavy table it's acceptable in this context.
        recs_df.to_sql('recommendations', engine, if_exists='replace', index=False)
            
        print("✅ Recommendations saved successfully!")
        update_ml_status("Hybrid Recommender", "completed", 100, "Recommendations saved successfully!")
    else:
        print("⚠️ No recommendations generated.")
        update_ml_status("Hybrid Recommender", "completed", 100, "No recommendations generated.")

if __name__ == "__main__":
    try:
        train_recommender()
    except Exception as e:
        update_ml_status("Hybrid Recommender", "failed", 0, f"Error: {e}")
        print(f"Error: {e}")
