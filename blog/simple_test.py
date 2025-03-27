import sys
print(f'Python version: {sys.version}')
try:
    import langchain
    import langchain_groq
    from dotenv import load_dotenv
    import rich
    import pydantic
    print('All imports successful!')
except ImportError as e:
    print(f'Import failed: {e}')
