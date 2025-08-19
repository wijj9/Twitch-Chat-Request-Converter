class TwitchChatViewer {
    constructor() {
        this.chatData = [];
        this.filteredData = [];
        this.channels = new Map();
        this.currentChannel = null;
        this.searchTerm = '';
        this.dateFilters = { from: null, to: null };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // File input handling
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFile(files[0]);
            }
        });

        // Search functionality
        document.getElementById('channelSearch').addEventListener('input', (e) => {
            this.filterChannels(e.target.value);
        });

        document.getElementById('messageSearch').addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.filterAndDisplayMessages();
        });

        // Filter functionality
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyDateFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Scroll to bottom
        document.getElementById('scrollToBottom').addEventListener('click', () => {
            this.scrollToBottom();
        });

        // Date input enhancements
        this.setupDateInputs();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('messageSearch').focus();
            }
        });
    }

    setupDateInputs() {
        const fromInput = document.getElementById('dateFrom');
        const toInput = document.getElementById('dateTo');
        
        // Add click handlers to ensure the date picker opens
        [fromInput, toInput].forEach(input => {
            input.addEventListener('click', function(e) {
                // Force the date picker to open
                this.showPicker && this.showPicker();
            });
            
            // Add better keyboard support
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this === fromInput) {
                        toInput.focus();
                    } else {
                        document.getElementById('applyFilters').click();
                    }
                }
            });
        });
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            await this.processFile(file);
        }
    }

    async processFile(file) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        loadingOverlay.classList.add('show');

        try {
            console.log('Processing file:', file.name, 'Size:', file.size, 'bytes');
            
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let data;
            let processedFile = file;

            // Convert CSV to TXT first if it's a CSV file
            if (fileExtension === 'csv') {
                console.log('Converting CSV to TXT format before parsing...');
                processedFile = await this.convertCSVToTXT(file);
                console.log('CSV converted to TXT successfully, processing as text file...');
                data = await this.parseTextFile(processedFile);
            } else if (fileExtension === 'txt') {
                data = await this.parseTextFile(file);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                data = await this.parseExcel(file);
            } else {
                throw new Error('Unsupported file format. Please use CSV, TXT, or XLSX files.');
            }

            console.log('File parsed successfully, rows:', data.length);
            
            if (data.length === 0) {
                throw new Error('No valid data found in the file. Please check the file format.');
            }

            this.processChatData(data);
            this.updateUI();
            
            console.log('File processing completed successfully');
            
        } catch (error) {
            console.error('Error processing file:', error);
            this.showError(`Error processing file: ${error.message}`);
        } finally {
            loadingOverlay.classList.remove('show');
        }
    }

    convertCSVToTXT(csvFile) {
        return new Promise((resolve, reject) => {
            console.log('Converting CSV to TXT format...');
            
            // Update loading text
            const loadingOverlay = document.getElementById('loadingOverlay');
            const loadingText = loadingOverlay.querySelector('p');
            loadingText.textContent = 'Converting CSV to TXT format...';
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    let csvContent = e.target.result;
                    
                    // Update loading text
                    loadingText.textContent = 'Cleaning CSV data...';
                    
                    // Optional: Clean trailing semicolons (similar to PowerShell script)
                    console.log('Cleaning CSV data (removing trailing semicolons)...');
                    const cleanedLines = csvContent.split('\n').map(line => {
                        return line.replace(/;+$/, '');
                    });
                    
                    const cleanedContent = cleanedLines.join('\n');
                    
                    // Create a new File object with TXT extension
                    const txtFileName = csvFile.name.replace(/\.csv$/i, '.txt');
                    const txtFile = new File([cleanedContent], txtFileName, {
                        type: 'text/plain',
                        lastModified: Date.now()
                    });
                    
                    console.log(`CSV converted to TXT: ${csvFile.name} → ${txtFileName}`);
                    console.log(`Original size: ${csvFile.size} bytes, Cleaned size: ${txtFile.size} bytes`);
                    
                    const sizeDiff = csvFile.size - txtFile.size;
                    if (sizeDiff > 0) {
                        console.log(`Data cleaned: ${(sizeDiff / 1024).toFixed(2)} KB removed`);
                    }
                    
                    // Update loading text
                    loadingText.textContent = 'Processing converted file...';
                    
                    resolve(txtFile);
                } catch (error) {
                    console.error('Error converting CSV to TXT:', error);
                    reject(new Error(`Failed to convert CSV to TXT: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Error reading CSV file for conversion'));
            };
            
            reader.readAsText(csvFile, 'utf-8');
        });
    }

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            console.log('Starting Papa Parse with file size:', file.size, 'bytes');
            
            Papa.parse(file, {
                header: true,
                skipEmptyLines: 'greedy',
                delimiter: ',',
                quoteChar: '"',
                escapeChar: '"',
                // Force Papa Parse to read the entire file
                preview: 0,
                chunk: undefined,
                // Be more lenient with parsing errors
                dynamicTyping: false,
                fastMode: false,
                worker: false, // Disable web workers for better debugging
                transformHeader: (header) => {
                    // Clean headers and handle the semicolon issue
                    return header.trim().replace(/;+$/, '');
                },
                transform: (value, field) => {
                    if (value && typeof value === 'string') {
                        // Remove trailing semicolons and clean up the value
                        return value.trim().replace(/;+$/, '');
                    }
                    return value;
                },
                complete: (results) => {
                    console.log('Papa Parse complete');
                    console.log('Total rows parsed by Papa Parse:', results.data.length);
                    console.log('Papa Parse meta info:', results.meta);
                    console.log('Parsing errors:', results.errors.length);
                    console.log('Sample errors:', results.errors.slice(0, 5));
                    console.log('Sample raw data:', results.data.slice(0, 3));
                    console.log('Headers:', results.meta.fields);
                    
                    // Debug: Check if data is being parsed correctly
                    if (results.data.length > 0) {
                        console.log('First row data structure:', results.data[0]);
                        console.log('First row keys:', Object.keys(results.data[0]));
                        console.log('Field mappings for first row:');
                        console.log('- body:', results.data[0].body);
                        console.log('- body_full:', results.data[0].body_full);
                        console.log('- channel:', results.data[0].channel);
                        console.log('- login:', results.data[0].login);
                    }
                    
                    // Don't reject on parsing errors unless they're critical
                    const criticalErrors = results.errors.filter(error => 
                        error.type === 'Delimiter' && error.code === 'UndetectableDelimiter'
                    );
                    
                    if (criticalErrors.length > 0) {
                        console.error('Critical parsing errors:', criticalErrors);
                        reject(new Error('CSV parsing error: ' + criticalErrors[0].message));
                        return;
                    }
                    
                    // Filter out completely empty rows but be very permissive
                    const validData = results.data.filter((row, index) => {
                        if (!row || typeof row !== 'object') {
                            if (index < 10) console.log(`Filtering row ${index} - not an object:`, row);
                            return false;
                        }
                        
                        // Only require that the row has basic chat data
                        const hasMessage = (row.body && row.body.trim()) || (row.body_full && row.body_full.trim());
                        const hasChannel = row.channel && row.channel.trim();
                        const hasUser = row.login && row.login.trim();
                        
                        if (!hasMessage || !hasChannel || !hasUser) {
                            if (index < 20) { // Log more entries for debugging
                                console.log(`Filtering out row ${index} - missing required data:`, {
                                    hasMessage: !!hasMessage,
                                    hasChannel: !!hasChannel,
                                    hasUser: !!hasUser,
                                    sample: { 
                                        body: row.body ? row.body.substring(0, 50) : 'undefined',
                                        body_full: row.body_full ? row.body_full.substring(0, 50) : 'undefined',
                                        channel: row.channel,
                                        login: row.login 
                                    },
                                    allKeys: Object.keys(row)
                                });
                            }
                            return false;
                        }
                        
                        return true;
                    });
                    
                    console.log('Valid data rows after filtering:', validData.length);
                    console.log('Sample valid data:', validData.slice(0, 3));
                    
                    if (validData.length === 0) {
                        console.log('No valid data found, trying alternative parsing...');
                        this.parseCSVAlternative(file).then(resolve).catch(reject);
                        return;
                    }
                    
                    resolve(validData);
                },
                error: (error) => {
                    console.error('Papa Parse error:', error);
                    console.log('Trying alternative parsing method...');
                    this.parseCSVAlternative(file).then(resolve).catch(reject);
                }
            });
        });
    }

    parseCSVAlternative(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    console.log('Starting alternative CSV parsing...');
                    const text = e.target.result;
                    const lines = text.split('\n');
                    
                    console.log('Total lines in file:', lines.length);
                    
                    if (lines.length < 2) {
                        reject(new Error('File appears to be empty or has insufficient data'));
                        return;
                    }
                    
                    // Enhanced header detection - handle multiple header lines and mixed separators
                    let headers = [];
                    let dataStartIndex = 1;
                    
                    for (let i = 0; i < lines.length && i < 5; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        // Detect if this line contains headers
                        if (line.toLowerCase().includes('timestamp') || 
                            line.toLowerCase().includes('channel') || 
                            line.toLowerCase().includes('login') ||
                            line.toLowerCase().includes('body')) {
                            
                            // Parse headers with mixed separator detection
                            const possibleHeaders = this.parseCSVLineWithMixedSeparators(line);
                            if (possibleHeaders.length > headers.length) {
                                headers = possibleHeaders.map(h => h.trim().replace(/"/g, '').replace(/;+$/, ''));
                                dataStartIndex = i + 1;
                                console.log(`Found headers at line ${i}:`, headers);
                            }
                        }
                    }
                    
                    if (headers.length === 0) {
                        // Fallback to first line
                        headers = this.parseCSVLineWithMixedSeparators(lines[0].trim())
                            .map(h => h.trim().replace(/"/g, '').replace(/;+$/, ''));
                        dataStartIndex = 1;
                    }
                    
                    console.log('Final headers:', headers);
                    console.log('Number of headers:', headers.length);
                    console.log('Data starts at line:', dataStartIndex);
                    
                    const data = [];
                    let processedLines = 0;
                    let validLines = 0;
                    
                    for (let i = dataStartIndex; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        // Skip duplicate header lines
                        if (line.toLowerCase().includes('timestamp') && 
                            line.toLowerCase().includes('channel') && 
                            line.toLowerCase().includes('login')) {
                            console.log(`Skipping duplicate header at line ${i}`);
                            continue;
                        }
                        
                        processedLines++;
                        
                        // Parse with mixed separator support
                        const values = this.parseCSVLineWithMixedSeparators(line);
                        
                        if (values.length > 0) {
                            const row = {};
                            
                            // Map values to headers
                            headers.forEach((header, index) => {
                                if (index < values.length && header) {
                                    let value = values[index];
                                    if (value) {
                                        // Clean up the value more thoroughly
                                        value = value.trim().replace(/^"|"$/g, '').replace(/;+$/, '');
                                    }
                                    row[header] = value || '';
                                }
                            });
                            
                            // Be very permissive - only filter out completely empty rows
                            // or rows missing the most critical chat fields
                            const hasMessage = (row.body && row.body.trim()) || (row.body_full && row.body_full.trim());
                            const hasChannel = row.channel && row.channel.trim();
                            const hasUser = row.login && row.login.trim();
                            
                            // Only require basic chat data to be present
                            if (hasMessage && hasChannel && hasUser) {
                                data.push(row);
                                validLines++;
                            } else if (processedLines <= 10) {
                                // Log first few filtered entries for debugging
                                console.log(`Filtering line ${i} - missing required fields:`, {
                                    hasMessage: !!hasMessage,
                                    hasChannel: !!hasChannel,
                                    hasUser: !!hasUser,
                                    rawLine: line.substring(0, 200) + '...'
                                });
                            }
                        }
                        
                        // Log progress for large files
                        if (processedLines % 10000 === 0) {
                            console.log(`Processed ${processedLines} lines, found ${validLines} valid entries...`);
                        }
                    }
                    
                    console.log(`Alternative parsing completed:`);
                    console.log(`- Total lines processed: ${processedLines}`);
                    console.log(`- Valid entries found: ${validLines}`);
                    console.log('Sample parsed data:', data.slice(0, 3));
                    
                    resolve(data);
                    
                } catch (error) {
                    console.error('Alternative parsing error:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file, 'utf-8');
        });
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                    continue;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
            i++;
        }
        
        // Add the last value
        values.push(current);
        
        return values;
    }

    parseCSVLineWithMixedSeparators(line) {
        // First, detect the primary separator used in this line
        let separator = ',';
        
        // Count separators outside of quotes to determine which is more common
        let commaCount = 0;
        let semicolonCount = 0;
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (!inQuotes) {
                if (char === ',') commaCount++;
                if (char === ';') semicolonCount++;
            }
        }
        
        // Use the more frequent separator
        if (semicolonCount > commaCount) {
            separator = ';';
        }
        
        const values = [];
        let current = '';
        inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next character
                    continue;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === separator && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last value
        values.push(current.trim());
        
        // Clean up trailing semicolons from values
        return values.map(value => value.replace(/;+$/, ''));
    }

    parseTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    console.log('Starting text file parsing...');
                    const text = e.target.result;
                    const lines = text.split('\n');
                    
                    console.log('Total lines in text file:', lines.length);
                    
                    if (lines.length < 2) {
                        reject(new Error('File appears to be empty or has insufficient data'));
                        return;
                    }
                    
                    // Enhanced header detection for text files
                    let headers = [];
                    let dataStartIndex = 1;
                    
                    // First, clean the first line and check if it contains headers
                    const firstLine = lines[0].trim();
                    console.log('First line raw:', firstLine.substring(0, 200) + '...');
                    
                    // Clean up the first line by removing trailing semicolons
                    const cleanedFirstLine = firstLine.replace(/;+$/, '');
                    console.log('First line cleaned:', cleanedFirstLine.substring(0, 200) + '...');
                    
                    // Check if first line contains header keywords
                    if (cleanedFirstLine.toLowerCase().includes('time') &&
                        cleanedFirstLine.toLowerCase().includes('channel') && 
                        cleanedFirstLine.toLowerCase().includes('login') &&
                        cleanedFirstLine.toLowerCase().includes('body')) {
                        
                        // Parse headers - split by comma since we can see it's comma-separated
                        headers = cleanedFirstLine.split(',').map(h => h.trim().replace(/"/g, ''));
                        dataStartIndex = 1;
                        console.log(`Found headers in first line:`, headers.slice(0, 10), '... (showing first 10)');
                    } else {
                        // Fallback: assume first line is headers anyway
                        headers = cleanedFirstLine.split(',').map(h => h.trim().replace(/"/g, ''));
                        dataStartIndex = 1;
                        console.log(`Using first line as headers (fallback):`, headers.slice(0, 10), '... (showing first 10)');
                    }
                    
                    console.log('Final headers for text file:', headers);
                    console.log('Number of headers:', headers.length);
                    console.log('Data starts at line:', dataStartIndex);
                    
                    const data = [];
                    let processedLines = 0;
                    let validLines = 0;
                    
                    for (let i = dataStartIndex; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        processedLines++;
                        
                        // Clean the line first by removing trailing semicolons
                        const cleanedLine = line.replace(/;+$/, '');
                        
                        // Parse with comma separation (we know the format is comma-separated)
                        const values = cleanedLine.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                        
                        if (values.length > 0) {
                            const row = {};
                            
                            // Map values to headers
                            headers.forEach((header, index) => {
                                if (index < values.length && header) {
                                    row[header] = values[index] || '';
                                }
                            });
                            
                            // Debug the first few rows
                            if (processedLines <= 5) {
                                console.log(`Row ${processedLines} mapping:`, {
                                    body: row.body,
                                    body_full: row.body_full,
                                    channel: row.channel,
                                    login: row.login,
                                    valuesLength: values.length,
                                    headersLength: headers.length
                                });
                            }
                            
                            // Be very permissive - only filter out completely empty rows
                            const hasMessage = (row.body && row.body.trim()) || (row.body_full && row.body_full.trim());
                            const hasChannel = row.channel && row.channel.trim();
                            const hasUser = row.login && row.login.trim();
                            
                            // Only require basic chat data to be present
                            if (hasMessage && hasChannel && hasUser) {
                                data.push(row);
                                validLines++;
                            } else if (processedLines <= 10) {
                                // Log first few filtered entries for debugging
                                console.log(`Filtering line ${i} - missing required fields:`, {
                                    hasMessage: !!hasMessage,
                                    hasChannel: !!hasChannel,
                                    hasUser: !!hasUser,
                                    body: row.body,
                                    body_full: row.body_full,
                                    channel: row.channel,
                                    login: row.login,
                                    rawLine: cleanedLine.substring(0, 200) + '...'
                                });
                            }
                        }
                        
                        // Log progress for large files
                        if (processedLines % 10000 === 0) {
                            console.log(`Processed ${processedLines} lines, found ${validLines} valid entries...`);
                        }
                    }
                    
                    console.log(`Text file parsing completed:`);
                    console.log(`- Total lines processed: ${processedLines}`);
                    console.log(`- Valid entries found: ${validLines}`);
                    console.log('Sample parsed data:', data.slice(0, 3));
                    
                    resolve(data);
                    
                } catch (error) {
                    console.error('Text file parsing error:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error reading text file'));
            reader.readAsText(file, 'utf-8');
        });
    }

    parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsArrayBuffer(file);
        });
    }

    processChatData(rawData) {
        console.log('Processing raw data:', rawData.length, 'rows');
        console.log('Sample raw data (first 3 rows):', rawData.slice(0, 3));
        
        // Check what fields are available
        if (rawData.length > 0) {
            console.log('Available fields in data:', Object.keys(rawData[0]));
        }
        
        this.chatData = rawData.map((row, index) => {
            // Parse timestamp - handle your specific format
            let timestamp = new Date();
            if (row.time || row.timestamp || row.server_timestamp) {
                const timeString = row.time || row.timestamp || row.server_timestamp;
                timestamp = new Date(timeString);
                if (isNaN(timestamp.getTime())) {
                    // Try parsing different formats
                    timestamp = this.parseTimestamp(timeString);
                }
            }

            // Clean up message text - remove quotes and extra whitespace
            let messageText = row.body || row.body_full || row.message || '';
            if (typeof messageText === 'string') {
                messageText = messageText.replace(/^["']|["']$/g, '').trim();
            }

            // Clean up username - be more flexible with usernames
            let username = row.login || row.username || '';
            if (typeof username === 'string') {
                username = username.trim();
            }
            if (!username || username === '') {
                username = 'Anonymous';
            }

            // Clean up channel name
            let channel = row.channel || '';
            if (typeof channel === 'string') {
                channel = channel.trim();
            }
            if (!channel || channel === '') {
                channel = 'unknown';
            }

            const processedMessage = {
                id: row.msg_id || `msg_${index}`,
                username: username,
                message: messageText,
                channel: channel,
                timestamp: timestamp,
                userId: row.user_id || null,
                country: row.country || null,
                city: row.city || null,
                isReply: row.is_reply === 't' || row.is_reply === 'true',
                isMention: row.is_mention === 't' || row.is_mention === 'true',
                original: row
            };

            // Log first few processed messages for debugging
            if (index < 5) {
                console.log(`Processed message ${index}:`, processedMessage);
            }

            return processedMessage;
        }).filter((msg, index) => {
            // Be extremely inclusive - only filter out completely empty entries
            const hasMessage = msg.message && msg.message.trim() !== '';
            const hasUser = msg.username && msg.username !== '' && msg.username !== 'Anonymous';
            const hasChannel = msg.channel && msg.channel !== '' && msg.channel !== 'unknown';
            
            // We need at least a message AND either a user or channel
            const isValid = hasMessage && (hasUser || hasChannel);
            
            if (!isValid && index < 10) {
                console.log(`Filtering out invalid message ${index}:`, {
                    hasMessage,
                    hasUser,
                    hasChannel,
                    msg: msg
                });
            }
            
            return isValid;
        });

        console.log('Final processed chat data:', this.chatData.length, 'messages');
        console.log('Sample processed data (first 3 messages):', this.chatData.slice(0, 3));

        // Group by channels
        this.channels.clear();
        this.chatData.forEach(message => {
            const channel = message.channel;
            if (!this.channels.has(channel)) {
                this.channels.set(channel, []);
            }
            this.channels.get(channel).push(message);
        });

        const channelStats = Array.from(this.channels.entries()).map(([ch, msgs]) => `${ch}: ${msgs.length}`);
        console.log('Channels found:', Array.from(this.channels.keys()));
        console.log('Channel message counts:', channelStats);

        // Sort messages in each channel by timestamp
        this.channels.forEach(messages => {
            messages.sort((a, b) => a.timestamp - b.timestamp);
        });

        this.filteredData = [...this.chatData];
    }

    parseTimestamp(timeString) {
        console.log('Parsing timestamp:', timeString);
        
        // Try different timestamp formats
        const formats = [
            // ISO format: 2020-10-31 12:48:11
            /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/,
            // Unix timestamp (milliseconds)
            /^(\d{13})$/,
            // Unix timestamp (seconds)
            /^(\d{10})$/
        ];

        for (let i = 0; i < formats.length; i++) {
            const format = formats[i];
            const match = timeString.toString().match(format);
            if (match) {
                if (i === 1) {
                    // Unix timestamp in milliseconds
                    const timestamp = parseInt(match[1]);
                    return new Date(timestamp);
                } else if (i === 2) {
                    // Unix timestamp in seconds
                    const timestamp = parseInt(match[1]);
                    return new Date(timestamp * 1000);
                } else {
                    // ISO format
                    return new Date(match[1]);
                }
            }
        }

        console.warn('Could not parse timestamp:', timeString);
        return new Date();
    }

    updateUI() {
        console.log('Updating UI with', this.chatData.length, 'messages and', this.channels.size, 'channels');
        
        this.updateHeaderStats();
        this.updateChannelsList();
        this.updateDateFilters();
        
        // Select first channel by default
        if (this.channels.size > 0) {
            const firstChannel = this.channels.keys().next().value;
            console.log('Selecting first channel:', firstChannel);
            this.selectChannel(firstChannel);
        } else {
            console.warn('No channels found to select');
        }
    }

    updateHeaderStats() {
        document.getElementById('totalMessages').textContent = this.chatData.length.toLocaleString();
        document.getElementById('totalChannels').textContent = this.channels.size;
    }

    updateChannelsList() {
        const channelsList = document.getElementById('channelsList');
        channelsList.innerHTML = '';

        if (this.channels.size === 0) {
            channelsList.innerHTML = '<div class="no-data">No channels found</div>';
            return;
        }

        // Sort channels by message count
        const sortedChannels = Array.from(this.channels.entries())
            .sort((a, b) => b[1].length - a[1].length);

        sortedChannels.forEach(([channel, messages]) => {
            const channelItem = document.createElement('div');
            channelItem.className = 'channel-item';
            channelItem.innerHTML = `
                <div class="channel-name">
                    <i class="fas fa-hashtag"></i>
                    <span>${this.escapeHtml(channel)}</span>
                </div>
                <span class="message-count">${messages.length}</span>
            `;
            
            channelItem.addEventListener('click', () => {
                this.selectChannel(channel);
            });
            
            channelsList.appendChild(channelItem);
        });
    }

    selectChannel(channel) {
        // Show loading overlay immediately
        this.showChannelLoadingOverlay(channel);
        
        // Update active channel in UI
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const channelItems = Array.from(document.querySelectorAll('.channel-item'));
        const activeItem = channelItems.find(item => 
            item.querySelector('.channel-name span').textContent === channel
        );
        if (activeItem) {
            activeItem.classList.add('active');
        }

        this.currentChannel = channel;
        document.getElementById('channelName').textContent = channel;
        
        // Simulate loading time based on message count for better UX
        const messages = this.channels.get(channel) || [];
        const loadingTime = Math.min(Math.max(messages.length / 2000, 150), 1000); // 150ms to 1s
        
        setTimeout(() => {
            this.hideChannelLoadingOverlay();
            this.filterAndDisplayMessages();
        }, loadingTime);
    }

    showChannelLoadingOverlay(channel) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = loadingOverlay.querySelector('p');
        
        // Update loading text for channel switching
        const messageCount = this.channels.get(channel)?.length || 0;
        loadingText.textContent = `Loading #${channel} (${messageCount.toLocaleString()} messages)...`;
        
        // Show the overlay
        loadingOverlay.classList.add('show');
    }

    hideChannelLoadingOverlay() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = loadingOverlay.querySelector('p');
        
        // Hide the overlay
        loadingOverlay.classList.remove('show');
        
        // Reset text back to file processing
        loadingText.textContent = 'Processing your file...';
    }

    filterChannels(searchTerm) {
        const channelItems = document.querySelectorAll('.channel-item');
        channelItems.forEach(item => {
            const channelName = item.querySelector('.channel-name span').textContent.toLowerCase();
            const isVisible = channelName.includes(searchTerm.toLowerCase());
            item.style.display = isVisible ? 'flex' : 'none';
        });
    }

    filterAndDisplayMessages() {
        if (!this.currentChannel) return;

        let messages = this.channels.get(this.currentChannel) || [];
        console.log(`Starting with ${messages.length} messages for channel: ${this.currentChannel}`);
        
        // Apply search filter
        if (this.searchTerm) {
            const originalCount = messages.length;
            messages = messages.filter(msg => 
                msg.message.toLowerCase().includes(this.searchTerm) ||
                msg.username.toLowerCase().includes(this.searchTerm)
            );
            console.log(`After search filter '${this.searchTerm}': ${messages.length} messages (filtered out ${originalCount - messages.length})`);
        }

        // Apply date filters
        if (this.dateFilters.from || this.dateFilters.to) {
            const originalCount = messages.length;
            console.log('Applying date filters:', this.dateFilters);
            
            if (messages.length > 0) {
                console.log('Sample message timestamps:', messages.slice(0, 3).map(msg => ({
                    timestamp: msg.timestamp,
                    timeString: msg.timestamp.toISOString(),
                    localString: msg.timestamp.toLocaleString()
                })));
            }
            
            messages = messages.filter(msg => {
                const msgDate = msg.timestamp;
                
                if (this.dateFilters.from && msgDate < this.dateFilters.from) {
                    return false;
                }
                if (this.dateFilters.to && msgDate > this.dateFilters.to) {
                    return false;
                }
                return true;
            });
            
            console.log(`After date filter: ${messages.length} messages (filtered out ${originalCount - messages.length})`);
            
            if (messages.length === 0 && originalCount > 0) {
                console.log('No messages match date filter. Date range:', {
                    from: this.dateFilters.from?.toLocaleString(),
                    to: this.dateFilters.to?.toLocaleString()
                });
            }
        }

        this.displayMessages(messages);
    }

    displayMessages(messages) {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';

        if (messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="no-data">
                    <p>No messages found${this.searchTerm ? ' for your search' : ''}.</p>
                </div>
            `;
            return;
        }

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            chatMessages.appendChild(messageElement);
        });

        this.scrollToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        if (this.searchTerm && message.message.toLowerCase().includes(this.searchTerm)) {
            messageDiv.classList.add('highlighted');
        }

        const timeString = this.formatTimestamp(message.timestamp);
        const username = this.generateUsernameColor(message.username);

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="username" style="color: ${username.color}">${this.escapeHtml(message.username)}</span>
                    <span class="timestamp">${timeString}</span>
                    <span class="channel-tag">${this.escapeHtml(message.channel)}</span>
                </div>
                <div class="message-text">${this.formatMessage(message.message)}</div>
            </div>
        `;

        return messageDiv;
    }

    generateUsernameColor(username) {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
            '#dda0dd', '#98d8c8', '#ffd93d', '#6c5ce7', '#a29bfe',
            '#fd79a8', '#fdcb6e', '#e17055', '#74b9ff', '#00b894'
        ];
        
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colorIndex = Math.abs(hash) % colors.length;
        return { color: colors[colorIndex] };
    }

    formatTimestamp(timestamp) {
        // If we're using date filters, show the actual date/time for better clarity
        if (this.dateFilters.from || this.dateFilters.to) {
            return timestamp.toLocaleString();
        }
        
        // Otherwise use relative time
        const now = new Date();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return timestamp.toLocaleDateString();
        } else if (days > 0) {
            return `${days}d ago`;
        } else if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    }

    formatMessage(message) {
        // Basic message formatting
        let formatted = this.escapeHtml(message);
        
        // Highlight emotes (simple pattern matching)
        formatted = formatted.replace(/\b[A-Z][a-z]+[A-Z][a-z]*\b/g, (match) => {
            if (this.isLikelyEmote(match)) {
                return `<span style="background-color: rgba(145, 70, 255, 0.2); padding: 2px 4px; border-radius: 3px;">${match}</span>`;
            }
            return match;
        });

        // Highlight search terms
        if (this.searchTerm) {
            const regex = new RegExp(`(${this.escapeRegex(this.searchTerm)})`, 'gi');
            formatted = formatted.replace(regex, '<mark style="background-color: #9146ff; color: white; padding: 1px 2px;">$1</mark>');
        }

        return formatted;
    }

    isLikelyEmote(text) {
        // Common Twitch emote patterns
        const emotePatterns = [
            /^Kappa$/i, /^PogChamp$/i, /^LUL$/i, /^EZ$/i, /^WutFace$/i,
            /^SeemsGood$/i, /^NotLikeThis$/i, /^FeelsGoodMan$/i, /^FeelsBadMan$/i
        ];
        
        return emotePatterns.some(pattern => pattern.test(text)) || 
               (text.length <= 25 && /^[A-Z][a-z]*[A-Z]/.test(text));
    }

    updateDateFilters() {
        if (this.chatData.length === 0) return;

        const timestamps = this.chatData.map(msg => msg.timestamp).sort();
        const earliest = timestamps[0];
        const latest = timestamps[timestamps.length - 1];

        console.log('Setting up date filters with range:', {
            earliest: earliest.toLocaleString(),
            latest: latest.toLocaleString()
        });

        const fromInput = document.getElementById('dateFrom');
        const toInput = document.getElementById('dateTo');

        // Set min/max bounds
        fromInput.min = this.formatDateForInput(earliest);
        fromInput.max = this.formatDateForInput(latest);
        toInput.min = this.formatDateForInput(earliest);
        toInput.max = this.formatDateForInput(latest);
        
        // Set placeholder text to show available range
        fromInput.title = `Available range: ${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`;
        toInput.title = `Available range: ${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`;
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    applyDateFilters() {
        const fromDate = document.getElementById('dateFrom').value;
        const toDate = document.getElementById('dateTo').value;
        
        console.log('Applying date filters:', { fromDate, toDate });

        // Parse dates more carefully to avoid timezone issues
        if (fromDate) {
            // Create date at start of day in local timezone
            const fromParts = fromDate.split('-');
            this.dateFilters.from = new Date(parseInt(fromParts[0]), parseInt(fromParts[1]) - 1, parseInt(fromParts[2]), 0, 0, 0);
            console.log('From date set to:', this.dateFilters.from);
        } else {
            this.dateFilters.from = null;
        }
        
        if (toDate) {
            // Create date at end of day in local timezone
            const toParts = toDate.split('-');
            this.dateFilters.to = new Date(parseInt(toParts[0]), parseInt(toParts[1]) - 1, parseInt(toParts[2]), 23, 59, 59, 999);
            console.log('To date set to:', this.dateFilters.to);
        } else {
            this.dateFilters.to = null;
        }

        console.log('Current date filters:', this.dateFilters);
        this.filterAndDisplayMessages();
    }

    clearFilters() {
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('messageSearch').value = '';
        document.getElementById('channelSearch').value = '';

        this.dateFilters = { from: null, to: null };
        this.searchTerm = '';

        this.filterChannels('');
        this.filterAndDisplayMessages();
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').classList.add('show');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Global functions for modal handling
function closeErrorModal() {
    document.getElementById('errorModal').classList.remove('show');
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatViewer = new TwitchChatViewer();
});

// Handle window resize for responsive design
window.addEventListener('resize', () => {
    const sidebar = document.querySelector('.sidebar');
    const width = window.innerWidth;
    
    if (width > 640 && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
    }
});

// Add mobile menu toggle functionality
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}
