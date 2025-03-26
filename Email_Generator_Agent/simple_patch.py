"""
Simple direct patching for Pydantic v2 compatibility with langchain-google-genai.
This is a fallback approach that doesn't use import hooks.
"""

def patch_pydantic():
    """
    Apply direct patches to Pydantic v2 for compatibility with langchain-google-genai
    """
    try:
        # First check if we're using Pydantic v2+
        import pydantic
        version = getattr(pydantic, "__version__", "0.0.0")
        major_version = int(version.split('.')[0])
        
        if major_version < 2:
            print(f"Using Pydantic v{version}, no patches needed")
            return True
            
        # Only patch if we're using Pydantic v2+
        from pydantic import SecretStr
        
        # Check if patching is needed
        if not hasattr(SecretStr, "__get_pydantic_json_schema__") and hasattr(SecretStr, "__modify_schema__"):
            # Add the missing method
            def get_pydantic_json_schema(cls, _schema_generator, _field_schema):
                schema = {"type": "string", "format": "password"}
                return schema
                
            # Apply the patch
            SecretStr.__get_pydantic_json_schema__ = classmethod(get_pydantic_json_schema)
            print(f"Successfully patched Pydantic v{version} SecretStr class")
            
        return True
    except Exception as e:
        print(f"Error patching Pydantic: {e}")
        return False

# Apply the patch immediately when this module is imported
patch_result = patch_pydantic()
print(f"Simple Pydantic patch {'applied successfully' if patch_result else 'failed'}") 