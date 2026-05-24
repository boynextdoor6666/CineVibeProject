import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

basedir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(basedir, '../../movie-aggregator-backend-nest/.env')
load_dotenv(env_path)

db_url = f"mysql+pymysql://root:@localhost:3306/cinema_hub"
try:
    engine = create_engine(f"mysql+pymysql://{os.getenv('DB_USER','root')}:{os.getenv('DB_PASS','')}@{os.getenv('DB_HOST','localhost')}:{os.getenv('DB_PORT','3306')}/{os.getenv('DB_NAME','cinema_hub')}")
    inspector = inspect(engine)
    print("Tables:", inspector.get_table_names())
    print("Reviews columns:", [c['name'] for c in inspector.get_columns('reviews')])
except Exception as e:
    print(e)
