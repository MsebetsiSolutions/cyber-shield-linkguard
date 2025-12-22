from backend.routes_opencti import bp

print(f"Blueprint: {bp.name}")
print(f"URL prefix: {bp.url_prefix}")
print(f"\nRoutes:")
for rule in bp.deferred_functions:
    print(f"  {rule}")
