"""
Enhanced compatibility patch for Pydantic v2 with langchain-google-genai.
This uses Python's import system to patch Pydantic classes before they're used.
"""

import sys
import types
import importlib.util
from importlib.abc import MetaPathFinder, Loader
from importlib.machinery import ModuleSpec

# Flag to track if we've already patched
_PATCHED = False

def apply_patches():
    """Apply all necessary patches to make Pydantic v2 work with langchain-google-genai"""
    global _PATCHED
    
    if _PATCHED:
        return
    
    try:
        # Try to import pydantic
        import pydantic
        
        # Check if we're using Pydantic v2+
        version = getattr(pydantic, "__version__", "0.0.0")
        major_version = int(version.split('.')[0])
        
        if major_version >= 2:
            # Patch SecretStr class
            patch_secret_str()
            
            print(f"Successfully patched Pydantic v{version} for compatibility")
        else:
            print(f"Using Pydantic v{version}, no patches needed")
            
    except ImportError:
        print("Pydantic not found, skipping patches")
    
    # Mark as patched to avoid double patching
    _PATCHED = True

def patch_secret_str():
    """
    Patch the SecretStr class in Pydantic v2 to add the missing method
    """
    try:
        from pydantic import SecretStr
        
        # Only patch if needed
        if not hasattr(SecretStr, "__get_pydantic_json_schema__") and hasattr(SecretStr, "__modify_schema__"):
            def get_pydantic_json_schema(cls, _schema_generator, _field_schema):
                schema = {"type": "string", "format": "password"}
                return schema
            
            # Add the missing method
            SecretStr.__get_pydantic_json_schema__ = classmethod(get_pydantic_json_schema)
            print("Successfully patched SecretStr.__get_pydantic_json_schema__")
            
        return True
    except Exception as e:
        print(f"Failed to patch SecretStr: {e}")
        return False

class PydanticPatchFinder(MetaPathFinder):
    """
    Custom import finder that intercepts Pydantic imports to apply patches
    """
    def find_spec(self, fullname, path, target=None):
        # We only care about pydantic modules
        if fullname.startswith('pydantic') or fullname.startswith('langchain_google_genai'):
            # Get the original spec
            for finder in sys.meta_path:
                if finder is self:
                    continue
                spec = finder.find_spec(fullname, path, target)
                if spec is not None:
                    # Create a patching loader
                    return ModuleSpec(
                        name=fullname,
                        loader=PydanticPatchLoader(spec.loader),
                        origin=spec.origin,
                        is_package=spec.submodule_search_locations is not None,
                        submodule_search_locations=spec.submodule_search_locations
                    )
        return None

class PydanticPatchLoader(Loader):
    """
    Custom loader that applies patches after module creation
    """
    def __init__(self, original_loader):
        self.original_loader = original_loader
        
    def create_module(self, spec):
        # Use the original loader to create the module
        return self.original_loader.create_module(spec)
        
    def exec_module(self, module):
        # Execute the original module code
        self.original_loader.exec_module(module)
        
        # If this is a pydantic module, apply patches after loading
        if module.__name__.startswith('pydantic') or module.__name__.startswith('langchain_google_genai'):
            apply_patches()

# Install our custom import hook
sys.meta_path.insert(0, PydanticPatchFinder())

# Apply patches immediately
apply_patches()

# Print confirmation
print("Pydantic compatibility patch loaded and ready")