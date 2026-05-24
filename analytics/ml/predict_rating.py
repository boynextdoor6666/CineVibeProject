import os
import sys
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from transformers import pipeline

# Загружаем переменные окружения
from dotenv import load_dotenv

basedir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(basedir, '../../movie-aggregator-backend-nest/.env')
load_dotenv(env_path)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASS', '')
DB_NAME = os.getenv('DB_NAME', 'warehouse')

# Подключение к БД
engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

def get_reviews_without_ratings():
    """
    Получает отзывы из базы данных, для которых не указан рейтинг.
    """
    query = """
    SELECT id, content_id, user_id, content 
    FROM reviews 
    WHERE rating IS NULL AND content IS NOT NULL AND content != '';
    """
    return pd.read_sql(text(query), engine)

def update_ml_status(task_name, status, progress, message):
    """Updates the ML task status in the database to make the progress visible."""
    try:
        with engine.begin() as conn:
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

def predict_ratings(reviews_df):
    """
    Использует NLP модель для анализа тональности текста и прогнозирования рейтинга (1-10).
    """
    if reviews_df.empty:
        print("Нет отзывов для анализа.")
        update_ml_status("NLP Rating Predictor", "completed", 100, "Нет отзывов для анализа.")
        return reviews_df

    print(f"Загрузка NLP модели для анализа {len(reviews_df)} отзывов...")
    update_ml_status("NLP Rating Predictor", "running", 20, f"Загрузка NLP модели для анализа {len(reviews_df)} отзывов...")
    
    # Используем многоязычную модель для предсказания звезд 1-5
    sentiment_pipeline = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")

    predicted_ratings = []
    
    total = len(reviews_df['content'])
    for idx, text in enumerate(reviews_df['content']):
        # Обновляем статус каждые 10 отзывов или вначале
        if idx % 10 == 0:
            progress = int(20 + (idx / total) * 60) # 20% to 80%
            update_ml_status("NLP Rating Predictor", "running", progress, f"Анализ отзыва {idx + 1} из {total}...")
            
        # Ограничиваем длину текста для BERT
        truncated_text = text[:512] 
        result = sentiment_pipeline(truncated_text)[0]
        
        # label возвращается в формате "X stars", например "4 stars"
        stars = int(result['label'].split()[0])
        
        # Переводим шкалу 1-5 в 1-10
        rating_10 = stars * 2 
        predicted_ratings.append(rating_10)

    reviews_df['predicted_rating'] = predicted_ratings
    update_ml_status("NLP Rating Predictor", "running", 80, "Анализ завершен, обновление базы данных...")
    return reviews_df

def update_predicted_ratings_in_db(reviews_df):
    """
    Обновляет предсказанные рейтинги в базе данных.
    """
    if reviews_df.empty or 'predicted_rating' not in reviews_df.columns:
        return

    update_ml_status("NLP Rating Predictor", "running", 90, "Сохранение результатов в БД...")
    with engine.begin() as conn:
        for _, row in reviews_df.iterrows():
            update_query = f"""
            UPDATE reviews 
            SET rating_predicted = {row['predicted_rating']} 
            WHERE id = '{row['id']}'
            """
            try:
                # Если в схеме нет поля rating_predicted, оно обновит rating.
                # Для безопасности в рамках курсовой обновляем само поле rating,
                # если оно было NULL.
                update_query_safe = text(f"""
                UPDATE reviews 
                SET rating = {row['predicted_rating']} 
                WHERE id = '{row['id']}' AND rating IS NULL
                """)
                conn.execute(update_query_safe)
            except Exception as e:
                print(f"Ошибка при обновлении отзыва {row['id']}: {e}")

    print(f"Успешно обновлено {len(reviews_df)} предсказанных рейтингов в БД.")
    update_ml_status("NLP Rating Predictor", "completed", 100, f"Успешно обновлено {len(reviews_df)} предсказанных рейтингов.")

if __name__ == "__main__":
    print("Начало процесса прогнозирования рейтингов с помощью NLP (Машинное обучение)...")
    update_ml_status("NLP Rating Predictor", "running", 5, "Начало процесса прогнозирования рейтингов...")
    try:
        df = get_reviews_without_ratings()
        rated_df = predict_ratings(df)
        update_predicted_ratings_in_db(rated_df)
        print("Процесс успешно завершен.")
    except Exception as e:
        update_ml_status("NLP Rating Predictor", "failed", 0, f"Произошла ошибка: {e}")
        print(f"Произошла ошибка: {e}")
