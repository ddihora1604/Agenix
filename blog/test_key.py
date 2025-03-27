import os
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv('GROQ_API_KEY')
if api_key:
    print(f'API key: {api_key[:4]}...{api_key[-4:]}')
else:
    print('API key not found')
