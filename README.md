# Twitch Chat Viewer

A modern web application that displays your Twitch chat data in a beautiful, Twitch-like interface. Import your CSV or XLSX files and browse your chat history with powerful filtering and search capabilities.

## Features

🎯 **Twitch-like UI**: Authentic chat interface that mimics the real Twitch experience
📊 **File Import**: Support for both CSV and XLSX file formats
🔍 **Advanced Search**: Search messages across all channels or within specific channels
📅 **Date Filtering**: Filter messages by date range
🏷️ **Channel Organization**: View all channels you've participated in with message counts
🎨 **Color-coded Usernames**: Each username gets a unique color for easy identification
⚡ **Real-time Filtering**: Instant search and filter results
📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Getting Started

1. **Open the Application**: Open `index.html` in your web browser
2. **Import Your Data**: 
   - Drag and drop your CSV/XLSX file onto the upload area, or
   - Click "Choose File" to browse and select your file
3. **Browse Your Chats**: 
   - Select channels from the sidebar to view their messages
   - Use search to find specific messages or users
   - Apply date filters to narrow down time ranges

## Supported File Formats

### CSV Files
The application automatically detects and maps common column names:
- `time`, `timestamp`, `server_timestamp` → Message timestamp
- `login`, `username` → Username
- `body`, `body_full`, `message` → Message content
- `channel` → Channel name
- `user_id` → User ID
- `country`, `city` → Location data
- `is_reply`, `is_mention` → Message metadata

### XLSX Files
Excel files are parsed using the same column mapping as CSV files.

## Sample Data Format

Your CSV/XLSX file should include these columns (column names are flexible):

```csv
time,login,body,channel,user_id,country,city
2020-10-31 12:48:11,username123,Hello world!,channelname,12345,US,New York
2020-10-31 12:49:15,anotheruser,Nice stream!,channelname,67890,CA,Toronto
```

## Features in Detail

### Chat Interface
- **Message Display**: Messages are displayed with timestamps, usernames, and channel tags
- **User Colors**: Each username gets a consistent, unique color
- **Emote Detection**: Common Twitch emotes are highlighted
- **Search Highlighting**: Search terms are highlighted in yellow

### Filtering & Search
- **Channel Filter**: Search channels by name in the sidebar
- **Message Search**: Search across all messages in the selected channel
- **Date Range**: Filter messages by start and end dates
- **Real-time Results**: All filters update instantly as you type

### Data Statistics
- **Total Messages**: See your total message count across all channels
- **Channel Count**: View how many different channels you've chatted in
- **Per-channel Stats**: Each channel shows its message count

## Browser Compatibility

This application works in all modern browsers:
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## Technical Details

### Built With
- **HTML5** - Semantic markup and file handling
- **CSS3** - Modern styling with Flexbox and Grid
- **JavaScript ES6+** - Modern JavaScript features
- **Papa Parse** - CSV parsing library
- **SheetJS** - Excel file parsing
- **Font Awesome** - Icons
- **Google Fonts** - Inter font family

### File Processing
- Files are processed entirely in the browser (no server required)
- Support for files up to 100MB
- Automatic column detection and mapping
- Error handling for malformed data

## Privacy & Security

- **100% Client-side**: All file processing happens in your browser
- **No Data Upload**: Your chat data never leaves your computer
- **No Tracking**: No analytics or tracking scripts
- **Offline Capable**: Works without an internet connection (after initial load)

## Troubleshooting

### File Won't Load
- Ensure your file is in CSV or XLSX format
- Check that required columns (time, message, channel, username) are present
- Verify the file isn't corrupted

### Missing Messages
- Check if date filters are applied
- Verify the timestamp format in your data
- Ensure the channel name matches exactly

### Performance Issues
- Large files (>50MB) may take time to process
- Consider splitting very large datasets into smaller files
- Close other browser tabs to free up memory

## Contributing

This is an open-source project. Feel free to:
- Report bugs or suggest features
- Improve the code or documentation
- Add support for additional file formats
- Enhance the UI/UX

## License

MIT License - Feel free to use this code for your own projects!

---

**Enjoy browsing your Twitch chat history!** 🎮💬
