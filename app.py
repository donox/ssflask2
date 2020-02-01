# run.py

from pathlib import Path
from dotenv import load_dotenv

env_path = Path('.') / '.env'
env_path = '/home/don/devel/ssflask2/.env'
load_dotenv(dotenv_path=env_path)

from ssfl import create_app
app = create_app()
