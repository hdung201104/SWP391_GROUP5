import re
import sys

def process_header():
    with open('d:/FA26/SWP/GROUP5/SWP391_GROUP5/hiremate-frontend/src/components/common/Header.jsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # General replacements
    replacements = [
        (r'bg-\[#F9F8F4\]/90 backdrop-blur-md border-b border-\[#E6E2DA\] shadow-\[.*?\]', 'bg-white border-b border-gray-200'),
        (r'text-\[#2D3A31\]', 'text-gray-900'),
        (r'bg-\[#2D3A31\]', 'bg-gray-900'),
        (r'text-\[#667067\]', 'text-gray-600'),
        (r'text-\[#8C9A84\]', 'text-gray-500'),
        (r'text-\[#C27B66\]', 'text-blue-500'),
        (r'bg-\[#C27B66\]', 'bg-blue-500'),
        (r'text-\[#1E293B\]', 'text-gray-900'),
        (r'text-\[#64748B\]', 'text-gray-600'),
        (r'text-\[#8B5CF6\]', 'text-blue-500'),
        (r'text-\[#34D399\]', 'text-emerald-500'),
        (r'bg-\[#8B5CF6\]', 'bg-blue-500'),
        (r'bg-\[#34D399\]', 'bg-emerald-500'),
        (r'bg-\[#FBBF24\]', 'bg-amber-500'),
        (r'text-\[#FBBF24\]', 'text-amber-500'),
        (r'border-\[#E6E2DA\]', 'border-gray-200'),
        (r'border-\[#CBD5E1\]', 'border-gray-200'),
        (r'border-\[#E2E8F0\]', 'border-gray-200'),
        (r'bg-\[#F2F0EB\]', 'bg-gray-100'),
        (r'bg-\[#F1F5F9\]', 'bg-gray-100'),
        (r'bg-\[#F8FAFC\]', 'bg-gray-50'),
        (r'bg-\[#FFFDF5\]', 'bg-white'),
        (r'shadow-soft-lg', ''),
        (r'shadow-soft', ''),
        (r'shadow-\[2px_2px_0px_#1E293B\]', ''),
        (r'shadow-pop-lg', ''),
        (r'rounded-2xl', 'rounded-lg'),
        (r'rounded-3xl', 'rounded-lg'),
        (r'font-serif', 'font-sans'),
        (r'font-body', 'font-sans'),
        (r'font-heading', 'font-sans'),
        (r'backdrop-blur-md', ''),
        (r'btn-botanical-primary', 'h-10 px-4 bg-blue-500 text-white font-semibold rounded-md transition-all duration-200 hover:bg-blue-600 hover:scale-105'),
        (r'btn-botanical-secondary', 'h-10 px-4 bg-gray-100 text-gray-900 font-semibold rounded-md transition-all duration-200 hover:bg-gray-200 hover:scale-105'),
    ]

    for old, new in replacements:
        content = re.sub(old, new, content)

    # Clean up empty class spaces
    content = re.sub(r'\s{2,}', ' ', content)
    content = re.sub(r'className="\s+', 'className="', content)
    content = re.sub(r'\s+"', '"', content)

    # Some targeted nav link replacements
    # Active state for buttons
    content = content.replace("bg-gray-900 text-white border border-gray-900", "bg-blue-500 text-white font-semibold border-transparent")
    content = content.replace("border border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100", "text-gray-600 font-medium hover:text-blue-500 hover:bg-gray-100 transition-colors duration-200")
    content = content.replace("border border-transparent text-[#687168] hover:text-[#26312A] hover:bg-gray-100", "text-gray-600 font-medium hover:text-blue-500 hover:bg-gray-100 transition-colors duration-200")

    # Mobile active
    content = content.replace("bg-amber-500 text-gray-900 border-2 border-gray-900 font-black", "bg-blue-500 text-white font-semibold")
    content = content.replace("bg-white border-2 border-gray-900 font-black", "bg-white")
    content = content.replace("text-gray-900 border-2 border-gray-900", "text-gray-900 border border-gray-200")
    
    with open('d:/FA26/SWP/GROUP5/SWP391_GROUP5/hiremate-frontend/src/components/common/Header.jsx', 'w', encoding='utf-8') as f:
        f.write(content)

process_header()
print("Header rewritten")
