import csv

input_file = "chat_messages.csv"
output_file = "messages_fixed.csv"

# Your column headers
headers = [
    "time","city","country","region","body_full","asn_id","ip","login",
    "server_timestamp","body","channel","msg_id","filtered_tags","asn",
    "user_id","time_utc","canonical_client_id","room_id","room_type",
    "chatroom_type","chatroom_id","channel_points_modification",
    "previously_dropped","is_reply","is_mention","chant_id","chant_message_id"
]

with open(input_file, newline='', encoding='utf-8') as infile, \
     open(output_file, 'w', newline='', encoding='utf-8') as outfile:

    reader = csv.reader(infile, delimiter=',', quotechar='"', skipinitialspace=True)
    writer = csv.writer(outfile)

    # Write headers
    writer.writerow(headers)

    for row in reader:
        # Only write rows that have the correct number of columns
        if len(row) == len(headers):
            writer.writerow(row)
        else:
            # Optional: fix rows that are too long by joining extra columns into the last field
            fixed_row = row[:len(headers)-1] + [','.join(row[len(headers)-1:])]
            writer.writerow(fixed_row)
