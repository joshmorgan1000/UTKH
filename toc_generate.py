import re

def generate_toc(input_file: str, output_file: str):
    # Regular expression to match headers with anchor links
    header_pattern = re.compile(r'^(#+)\s+(.*?)\s*<a href="#(.*?)"></a>')

    toc_lines = ["## Table of Contents\n"]

    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            for line in infile:
                match = header_pattern.match(line)
                if match:
                    level = len(match.group(1))  # Number of `#` indicates the level
                    if level == 1:
                        continue
                    text = match.group(2).strip()  # Header text
                    anchor = match.group(3).strip()  # Anchor link target
                    # Generate a TOC line with indentation based on header level
                    indent = "  " * (level - 2)
                    toc_lines.append(f"{indent}- [{text}](src/README.md#{anchor})\n")

        # Write the TOC to the output file
        with open(output_file, 'w', encoding='utf-8') as outfile:
            outfile.writelines(toc_lines)

        print(f"Table of contents generated successfully in '{output_file}'.")
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

# Usage
input_file = "src/README.md"
output_file = "TOC.md"
generate_toc(input_file, output_file)
