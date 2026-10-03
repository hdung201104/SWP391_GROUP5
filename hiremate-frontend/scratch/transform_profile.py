import re
import sys

def main():
    filepath = r"d:\FA26\SWP\GROUP5\SWP391_GROUP5\hiremate-frontend\src\pages\CandidateProfilePage.jsx"
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove useLivingTheme
    content = re.sub(r"import\s+\{\s*useLivingTheme\s*\}\s*from\s*['\"](?:../)+context/LivingThemeContext['\"];?\n*", "", content)
    content = re.sub(r"\s*const\s*\{\s*theme:\s*livingTheme(?:,\s*luminosity)?\s*\}\s*=\s*useLivingTheme\(\);\n*", "", content)

    # 3. Botanical classes global replacement
    replacements = [
        ('text-botanical-forest', 'text-gray-900'),
        ('text-botanical-terracotta', 'text-amber-500'),
        ('text-botanical-sage', 'text-emerald-500'),
        ('text-botanical-clay', 'text-gray-500'),
        ('bg-botanical-forest', 'bg-blue-500'),
        ('bg-botanical-terracotta', 'bg-amber-500'),
        ('bg-botanical-sage', 'bg-emerald-500'),
        ('bg-botanical-sage/20', 'bg-blue-50'),
        ('text-botanical-sage/80', 'text-blue-600'),
        ('bg-[#FAF9F5]', 'bg-gray-100'),
        ('bg-white/95', 'bg-white'),
        ('bg-white/90', 'bg-white'),
        ('border-botanical-stone', 'border-gray-200'),
        ('border-botanical-sage', 'border-emerald-500'),
        ('border-botanical-terracotta', 'border-amber-500'),
        ('font-serif', ''),
        ('font-sans', ''),
        ('shadow-soft-lg', ''),
        ('shadow-soft', ''),
        ('card-botanical', 'bg-white p-6 rounded-lg transition-all duration-200 hover:scale-[1.02]'),
        ('rounded-3xl', 'rounded-lg'),
        ('rounded-2xl', 'rounded-lg'),
        ('btn-botanical-primary', 'bg-blue-500 text-white font-semibold rounded-md transition-all duration-200 hover:bg-blue-600 hover:scale-105'),
        ('btn-botanical-secondary', 'bg-gray-100 text-gray-900 font-semibold rounded-md transition-all duration-200 hover:bg-gray-200 hover:scale-105'),
        ('input-botanical', 'h-12 px-4 bg-gray-100 rounded-md border-2 border-transparent focus:bg-white focus:border-blue-500 focus:outline-none w-full text-gray-900'),
        ('backdrop-blur-md', ''),
        ('backdrop-blur-xl', ''),
        ('backdrop-blur', ''),
        ('min-h-screen bg-transparent', 'min-h-screen bg-gray-100'),
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    # Replace inline styles and logic referencing livingTheme
    content = re.sub(r'style=\{\{\s*color:\s*livingTheme\.primary\s*\}\}', 'className="text-blue-500"', content)
    content = re.sub(r'style=\{\{\s*backgroundColor:\s*livingTheme\.primary\s*\}\}', 'className="bg-blue-500"', content)
    content = re.sub(r'livingTheme\.activeNavBg', '"bg-blue-500"', content)
    content = re.sub(r'livingTheme\.border', '"border-gray-200"', content)
    content = re.sub(r'livingTheme\.tagBg', '"bg-gray-100"', content)
    
    # fix the remaining occurrences of livingTheme like in conditional styling
    content = re.sub(r'livingTheme\.[a-zA-Z0-9_]+', '""', content)

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Replacements done for CandidateProfilePage.")

if __name__ == '__main__':
    main()
