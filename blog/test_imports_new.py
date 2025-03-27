#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\nimport sys\nprint(f"Python version: {sys.version}")\n\n# Test importing required packages\ntry:\n    import langchain\n    print(f"[OK] langchain version: {langchain.__version__}")\n    \n    import langchain_groq\n    print("[OK] langchain_groq imported successfully")\n    \n    from dotenv import load_dotenv\n    print("[OK] dotenv imported successfully")\n    \n    import rich\n    print("[OK] rich imported successfully")\n    \n    import pydantic\n    print(f"[OK] pydantic version: {pydantic.__version__}")\n    \n    print("\\n[OK] All imports successful!")\n    print("The Python environment is correctly set up for the blog generator.")\n    sys.exit(0)\nexcept ImportError as e:\n    print(f"\\n[ERROR] Import failed: {e}")\n    print("Please install the missing package using:")\n    print(f"pip install {str(e).split(" ")[-1]}")\n    sys.exit(1)\nexcept Exception as e:\n    print(f"\\n[ERROR] Unexpected error: {e}")\n    sys.exit(1)
