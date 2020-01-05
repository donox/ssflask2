# run.py
from application import create_app
from pathlib import Path
from dotenv import load_dotenv

env_path = Path('.') / '.env'
env_path = '/home/don/devel/ssflask/.env'
load_dotenv(dotenv_path=env_path)
app = create_app()
