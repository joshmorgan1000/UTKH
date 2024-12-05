import re

def generate_toc(input_file: str, output_file: str):
    # Regular expression to match headers with anchor links
    header_pattern = re.compile(r'^(#+)\s+(.*?)\s*<a href="#(.*?)"></a>')

    toc_lines = ["## Table of Contents\n"]
    summary_lines = ["You can find this hosted [here](http://sonicpoets.com/).\n\n"]
    summary_done_reading = False

    try:
        with open(input_file, 'r', encoding='utf-8') as infile:
            for line in infile:
                if line.startswith("##"):
                    summary_done_reading = True
                if not summary_done_reading:
                    summary_lines.append(line)
                match = header_pattern.match(line)
                if match:
                    level = len(match.group(1))  # Number of `#` indicates the level
                    if level == 1:
                        continue
                    text = match.group(2).strip()  # Header text
                    anchor = match.group(3).strip()  # Anchor link target
                    # Generate a TOC line with indentation based on header level
                    indent = "  " * (level - 2)
                    toc_lines.append(f"{indent}- [{text}](https://github.com/joshmorgan1000/UTKH/blob/main/THEORY.md#{anchor}-)\n")

        # Write the TOC to the output file
        with open(output_file, 'w', encoding='utf-8') as outfile:
            outfile.writelines(summary_lines + toc_lines)

        print(f"Table of contents generated successfully in '{output_file}'.")
    except FileNotFoundError:
        print(f"Error: File '{input_file}' not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

# Usage
input_file = "../THEORY.md"
output_file = "../README.md"
generate_toc(input_file, output_file)
