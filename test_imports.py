import sys
print('Python path:')
print(sys.path)
print('\nTesting imports:')

modules = [
    'langchain', 
    'langchain_community', 
    'langchain_google_genai', 
    'google.generativeai', 
    'faiss', 
    'bs4', 
    'lxml', 
    'dotenv', 
    'requests'
]

success = True
for module in modules:
    try:
        __import__(module)
        print(f'✓ {module}')
    except ImportError as e:
        print(f'✗ {module}: {str(e)}')
        success = False

print(f'\nImport test {"successful" if success else "failed"}') 