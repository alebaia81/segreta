import re

new_html = """<img
                src="/logo-footer-2.png"
                alt="Segreta Style Logo"
                className="footer-logo-img"
              />"""

new_css = """.footer-logo-img {
          max-height: 80px;
          object-fit: contain;
          display: block;
        }"""

for filename in ['src/pages/Home.jsx', 'src/pages/Shop.jsx']:
    with open(filename, 'r') as f:
        content = f.read()
    
    # Replace the HTML
    content = re.sub(
        r'<div className="footer-brand">\s*<span className="brand-segreta">SEGRETA</span>\s*<span className="brand-style">style</span>\s*</div>',
        new_html,
        content,
        flags=re.MULTILINE
    )
    
    # Replace the CSS
    content = re.sub(
        r'\.footer-brand\s*\{.*?\.brand-style\s*\{[^}]*\}',
        new_css,
        content,
        flags=re.DOTALL
    )
    
    with open(filename, 'w') as f:
        f.write(content)

