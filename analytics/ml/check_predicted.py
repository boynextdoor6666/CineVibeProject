import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

basedir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(basedir, '../../movie-aggregator-backend-nest/.env')
load_dotenv(env_path)

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '3306')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASS = os.getenv('DB_PASS', '')
DB_NAME = os.getenv('DB_NAME', 'cinema_hub')

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}")

with engine.begin() as conn:
    result = conn.execute(text("""
        SELECT c.id, c.title, r.rating, r.content 
        FROM reviews r 
        JOIN content c ON r.content_id = c.id 
        WHERE r.id IN (19, 24, 28)
    """)).fetchall()
    
    for r in result:
        print(f"Content ID: {r[0]}, Title: '{r[1]}', Predicted Rating: {r[2]}/10, Review: {r[3][:40]}...")
