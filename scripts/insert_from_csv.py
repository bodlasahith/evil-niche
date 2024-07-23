import csv
import re
import sys

file = open("./inserts.txt", "w")
import sys
sys.stdout = file


def csv_to_sql_insert(csv_file_path, table_name):
    insert_statements = []
    try:
        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            headers = next(reader)  # Get the column names from the first row
            for row in reader:
                columns = ', '.join(headers)
                values = ', '.join([clean_value(value) for value in row])
                statement = f"INSERT INTO {table_name} ({columns}) VALUES ({values});"
                insert_statements.append(statement)
    except FileNotFoundError:
        pass
    except Exception as e:
        pass

    return insert_statements

def clean_value(value):
    if value is None or value == '':
        return "2147483647"  # Maximum value for a 32-bit signed integer
    else:
        cleaned_value = re.sub(r"['\",]", "", str(value))
        return f"'{cleaned_value}'" if cleaned_value else "2147483647"
    


for year in range(1970, 2023):
    try:
        csv_file_path = f'../data/CircuitJudicialData/{year}_Judicial.csv'  # Replace with your CSV file path
        table_name = 'CircuitJudicial'  # Replace with your table name
        insert_statements = csv_to_sql_insert(csv_file_path, table_name)

        # Output the SQL statements to a file
        for statement in insert_statements:
            print(statement)

    except FileNotFoundError:
        # print(f"File {csv_file_path} does not exist. Skipping.")
        pass
    except Exception as e:
        # print(f"An error occurred while processing {csv_file_path}: {e}")
        pass

file.close()