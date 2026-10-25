import { VajraAction } from '../types';
import { sanitizeUrl, createSafeGoogleSearchUrl, createSafeYouTubeUrl } from './security';

/**
 * Extracts structured action blocks or detects natural user intents for:
 * 1. Opening YouTube
 * 2. Opening Google or searching Google (e.g. "Search Google for NASA")
 * 3. Opening specific URLs safely
 * 4. Opening desktop apps (Calculator, Notepad, File Explorer, Chrome, Terminal)
 * 5. Native File operations (create folder, create file, move file, open folder, rename, delete)
 */
export function extractActionsFromText(content: string, isUserMessage = false): {
  cleanedText: string;
  actions: VajraAction[];
} {
  const actions: VajraAction[] = [];
  let cleanedText = content;

  // 1. Look for structured vajra-action or nova-action JSON blocks
  const actionRegex = /```(?:json:vajra-action|vajra-action|json:nova-action|nova-action)\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.type) {
        actions.push({
          id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: parsed.type,
          title: parsed.title || 'System Action',
          url: parsed.url ? sanitizeUrl(parsed.url) || undefined : undefined,
          query: parsed.query,
          appName: parsed.appName,
          targetPath: parsed.targetPath || parsed.path,
          destinationPath: parsed.destinationPath || parsed.dest,
          fileContent: parsed.fileContent || parsed.content,
          description: parsed.description,
          requiresConfirmation: parsed.requiresConfirmation ?? (parsed.type === 'DELETE_FILE'),
          isNativeRequired: parsed.isNativeRequired ?? false,
          status: 'pending',
        });
      }
    } catch {
      // Ignore invalid JSON in action block
    }
  }

  // Strip raw code blocks from displayed chat text
  cleanedText = cleanedText.replace(actionRegex, '').trim();

  // 2. If no explicit block was generated, detect natural commands from user prompt or assistant response
  const lower = content.toLowerCase();

  // A. YouTube Intent (English, Hindi & Hinglish: "Open YouTube", "YouTube kholo", "YouTube chalu karo", "YouTube par ... search karo")
  const isYouTubeIntent =
    lower.includes('open youtube') ||
    lower.includes('youtube.com') ||
    lower.includes('launch youtube') ||
    lower.includes('youtube kholo') ||
    lower.includes('youtube chalu karo') ||
    lower.includes('youtube chalao') ||
    lower.includes('youtube start karo') ||
    lower.includes('youtube open karo') ||
    lower.includes('youtube pe') ||
    lower.includes('youtube par');

  if (isYouTubeIntent) {
    if (!actions.some((a) => a.url?.includes('youtube.com'))) {
      // Check query patterns:
      // Pattern 1: "youtube (par|pe|search|for) <query>"
      // Pattern 2: "<query> youtube par (search karo|chalao|dekho)"
      let query: string | undefined;

      const queryMatch1 = content.match(
        /youtube(?:.com)?(?:\s+(?:for|search|par|pe|me|par\s+search\s+karo))?\s+["']?([^"'\n.,]+)["']?/i
      );
      const queryMatch2 = content.match(
        /["']?([^"'\n.,]+)["']?\s+youtube\s+(?:par|pe)\s+(?:search\s+karo|chalao|chalu\s+karo|dekho|kholo)/i
      );

      const candidate = queryMatch2 ? queryMatch2[1] : queryMatch1 ? queryMatch1[1] : null;

      if (candidate) {
        const cleaned = candidate
          .replace(/^(?:kholo|chalu karo|start karo|open|launch|search|par|pe)\s+/gi, '')
          .replace(/\s+(?:kholo|chalu karo|start karo|search karo|dekho|chalao|batao)$/gi, '')
          .trim();

        if (
          cleaned.length > 1 &&
          !cleaned.toLowerCase().includes('kholo') &&
          !cleaned.toLowerCase().includes('open') &&
          !cleaned.toLowerCase().includes('chalu')
        ) {
          query = cleaned;
        }
      }

      actions.push({
        id: `act-yt-${Date.now()}`,
        type: 'OPEN_WEBSITE',
        title: query ? `YouTube: "${query}"` : 'Open YouTube',
        url: createSafeYouTubeUrl(query),
        description: query ? `Search YouTube for "${query}".` : 'Launch YouTube in browser tab.',
        status: 'pending',
      });
    }
  }

  // B. Google Search Intent (English, Hindi & Hinglish: "Search Google for NASA", "Google par Python search karo", "Python search karo", "Mausam batao")
  const isSearchIntent =
    (lower.includes('search') && lower.includes('google')) ||
    lower.startsWith('google ') ||
    lower.includes('search for') ||
    lower.includes('google par') ||
    lower.includes('google pe') ||
    lower.includes('search karo') ||
    lower.includes('khojo') ||
    lower.includes('dhoondo');

  const searchMatch = content.match(
    /(?:search\s+(?:for\s+)?|google\s+(?:par\s+|pe\s+)?)(["'][^"']+["']|[^,.\n]+?)(?:\s+on\s+google|\s+in\s+google|\s+search\s+karo|\s+khojo|\s+dhoondo|$)/i
  );

  if (isSearchIntent && !isYouTubeIntent) {
    if (!actions.some((a) => a.type === 'SEARCH_WEB')) {
      let queryToSearch = searchMatch
        ? searchMatch[1].replace(/["']/g, '').trim()
        : '';

      // Clean up common Hinglish filler words from search query
      queryToSearch = queryToSearch
        .replace(/^(?:par|pe|ke baare mein|ke bare me|karo|batao|search|dhoondo)\s+/gi, '')
        .replace(/\s+(?:search karo|khojo|dhoondo|karo|batao)$/gi, '')
        .trim();

      if (
        queryToSearch &&
        queryToSearch.length > 1 &&
        !queryToSearch.toLowerCase().startsWith('open') &&
        !queryToSearch.toLowerCase().startsWith('kholo')
      ) {
        actions.push({
          id: `act-search-${Date.now()}`,
          type: 'SEARCH_WEB',
          title: `Search: "${queryToSearch}"`,
          url: createSafeGoogleSearchUrl(queryToSearch),
          query: queryToSearch,
          description: `Execute Google search for "${queryToSearch}".`,
          status: 'pending',
        });
      }
    }
  }

  // C. Open Google Homepage (English & Hinglish: "Google kholo", "Google open karo", "Google chalu karo")
  if (
    (lower.includes('open google') ||
      lower === 'google' ||
      lower.includes('go to google') ||
      lower.includes('google kholo') ||
      lower.includes('google open karo') ||
      lower.includes('google chalu karo')) &&
    !actions.some((a) => a.url?.includes('google.com')) &&
    !actions.some((a) => a.type === 'SEARCH_WEB')
  ) {
    actions.push({
      id: `act-google-${Date.now()}`,
      type: 'OPEN_WEBSITE',
      title: 'Open Google Search',
      url: 'https://www.google.com',
      description: 'Navigate to Google homepage.',
      status: 'pending',
    });
  }

  // D. Mobile Directives: Call / Phone lagao (English, Hindi, Hinglish)
  // e.g. "Call 9876543210", "Phone lagao 9876543210", "Call karo +919876543210", "Dial 100"
  const callMatch = content.match(/(?:call\s*(?:karo)?|phone\s*(?:lagao|karo)?|dial\s*(?:karo)?)\s*[:]?\s*(\+?[0-9\s\-().]{3,18})/i);
  if (callMatch && !actions.some((a) => a.url?.startsWith('tel:'))) {
    const rawNumber = callMatch[1].replace(/[\s\-().]/g, '');
    if (rawNumber.length >= 3) {
      actions.push({
        id: `act-call-${Date.now()}`,
        type: 'OPEN_WEBSITE',
        title: `Call: ${callMatch[1].trim()}`,
        url: `tel:${rawNumber}`,
        description: `Trigger phone dialer for ${callMatch[1].trim()}`,
        status: 'pending',
      });
    }
  }

  // E. Mobile Directives: Email / Mail bhejo (English, Hindi, Hinglish)
  // e.g. "Mail bhejo user@example.com", "Email karo support@vajra.ai"
  const emailMatch = content.match(/(?:email\s*(?:karo|bhejo)?|mail\s*(?:bhejo|karo)?|send\s*email\s*to)\s*[:]?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch && !actions.some((a) => a.url?.startsWith('mailto:'))) {
    const targetEmail = emailMatch[1].trim();
    actions.push({
      id: `act-mail-${Date.now()}`,
      type: 'OPEN_WEBSITE',
      title: `Email: ${targetEmail}`,
      url: `mailto:${targetEmail}`,
      description: `Compose email to ${targetEmail}`,
      status: 'pending',
    });
  }

  // F. Mobile Directives: Maps / Navigation (English, Hindi, Hinglish)
  // e.g. "Map dikhao Mumbai", "Location dikhao Taj Mahal", "Rasta dikhao Delhi", "Maps kholo"
  const mapsMatch = content.match(/(?:map\s*(?:dikhao|kholo|pe\s*dhoondo)?|location\s*(?:dikhao|batao)?|rasta\s*(?:dikhao|batao)?|directions?\s*(?:to|dikhao)?)\s*[:]?\s*([^,.\n]+)/i);
  const isGenericMaps = lower === 'maps kholo' || lower === 'open maps' || lower === 'google maps';

  if ((mapsMatch || isGenericMaps) && !actions.some((a) => a.url?.includes('maps.google.com'))) {
    let place = mapsMatch ? mapsMatch[1].trim() : '';
    place = place.replace(/^(?:par|pe|kholo|dikhao)\s+/gi, '').trim();
    if (isGenericMaps || !place || place.toLowerCase() === 'kholo') {
      actions.push({
        id: `act-maps-${Date.now()}`,
        type: 'OPEN_WEBSITE',
        title: 'Open Google Maps',
        url: 'https://maps.google.com',
        description: 'Navigate to Google Maps.',
        status: 'pending',
      });
    } else if (place.length > 1) {
      actions.push({
        id: `act-maps-${Date.now()}`,
        type: 'OPEN_WEBSITE',
        title: `Map: ${place}`,
        url: `https://maps.google.com/?q=${encodeURIComponent(place)}`,
        description: `Show map location for "${place}".`,
        status: 'pending',
      });
    }
  }

  // G. Mobile Directives: Share (English, Hindi, Hinglish)
  // e.g. "Share karo", "Ye share karo", "Share this"
  if (
    (lower.includes('share karo') ||
      lower.includes('ye share karo') ||
      lower === 'share' ||
      lower.includes('share this') ||
      lower.includes('share response')) &&
    !actions.some((a) => a.title === 'Share')
  ) {
    actions.push({
      id: `act-share-${Date.now()}`,
      type: 'SYSTEM_ACTION',
      title: 'Share',
      description: 'Trigger system share sheet for current response.',
      status: 'pending',
    });
  }

  // D. Generic Website Intent (e.g. "Open wikipedia.org", "Open https://github.com")
  const urlMatch = content.match(/(?:https?:\/\/|www\.)[^\s<>"')]+|[a-zA-Z0-9-]+\.(?:com|org|io|dev|ai|net|edu|gov)(?:\/[^\s<>"']*)?/i);
  if (urlMatch && !actions.some((a) => a.url)) {
    const rawUrl = urlMatch[0];
    const safe = sanitizeUrl(rawUrl);
    if (safe && !safe.includes('youtube.com') && !safe.includes('google.com/search')) {
      try {
        const domain = new URL(safe).hostname;
        actions.push({
          id: `act-url-${Date.now()}`,
          type: 'OPEN_WEBSITE',
          title: `Open ${domain}`,
          url: safe,
          description: `Navigate to ${safe}`,
          status: 'pending',
        });
      } catch {}
    }
  }

  // E. Calculator Intent (English & Hinglish: "Open calculator", "Calculator start karo", "Calculator kholo", "Hisab karo")
  const isCalcIntent =
    lower.includes('open calculator') ||
    lower.includes('launch calculator') ||
    lower === 'calculator' ||
    lower.includes('calculator.') ||
    lower.includes('calculator start karo') ||
    lower.includes('calculator kholo') ||
    lower.includes('calculator chalu karo') ||
    lower.includes('hisab karo');

  if (isCalcIntent) {
    if (!actions.some((a) => a.appName === 'Calculator')) {
      actions.push({
        id: `act-calc-${Date.now()}`,
        type: 'OPEN_APP',
        title: 'Calculator',
        appName: 'Calculator',
        description: 'Launch Calculator / VAJRA Math Engine.',
        isNativeRequired: true,
        status: 'pending',
      });
    }
  }

  // F. Notepad / Scratchpad Intent (English & Hinglish: "Open notepad", "Mera note save karo", "Note likho", "Notes kholo")
  const isNotesIntent =
    lower.includes('open notepad') ||
    lower.includes('launch notepad') ||
    lower === 'notepad' ||
    lower.includes('notepad.') ||
    lower.includes('mera note save karo') ||
    lower.includes('note likho') ||
    lower.includes('note banao') ||
    lower.includes('notes kholo') ||
    lower.includes('scratchpad kholo');

  if (isNotesIntent) {
    if (!actions.some((a) => a.appName === 'Notepad')) {
      actions.push({
        id: `act-notes-${Date.now()}`,
        type: 'OPEN_APP',
        title: 'Notepad',
        appName: 'Notepad',
        description: 'Launch VAJRA Scratchpad / Note Editor.',
        isNativeRequired: true,
        status: 'pending',
      });
    }
  }

  // G. Desktop Apps: File Explorer (English & Hinglish: "Files kholo", "Folder kholo")
  const isFilesIntent =
    lower.includes('open file explorer') ||
    lower.includes('launch file explorer') ||
    lower === 'file explorer' ||
    lower.includes('file explorer.') ||
    lower.includes('files kholo') ||
    lower.includes('folder kholo');

  if (isFilesIntent) {
    if (!actions.some((a) => a.appName === 'File Explorer') && !actions.some((a) => a.type === 'OPEN_PATH')) {
      actions.push({
        id: `act-files-${Date.now()}`,
        type: 'OPEN_APP',
        title: 'File Explorer',
        appName: 'File Explorer',
        targetPath: 'Documents',
        description: 'Open VAJRA File Explorer.',
        isNativeRequired: true,
        status: 'pending',
      });
    }
  }

  // H. Weather Intent (English & Hinglish: "Weather batao", "Mausam kaisa hai", "Aaj ka mausam")
  const isWeatherIntent =
    lower.includes('weather batao') ||
    lower.includes('mausam kaisa hai') ||
    lower.includes('aaj ka mausam') ||
    lower.includes('weather report');

  if (isWeatherIntent && !actions.some((a) => a.title.includes('Weather'))) {
    actions.push({
      id: `act-weather-${Date.now()}`,
      type: 'SEARCH_WEB',
      title: 'Current Weather & Forecast',
      url: createSafeGoogleSearchUrl('current weather forecast'),
      query: 'current weather forecast',
      description: 'Check current regional weather conditions.',
      status: 'pending',
    });
  }

  // I. Reminders & Memory Intent (English & Hinglish: "Kal mujhe yaad dilana", "Remind me", "Yaad rakhna")
  const isReminderIntent =
    lower.includes('yaad dilana') ||
    lower.includes('remind me') ||
    lower.includes('yaad rakhna');

  if (isReminderIntent && !actions.some((a) => a.type === 'SYSTEM_ACTION')) {
    actions.push({
      id: `act-remind-${Date.now()}`,
      type: 'SYSTEM_ACTION',
      title: 'Set Reminder',
      description: 'Logged reminder directive to VAJRA persistent memory.',
      status: 'pending',
    });
  }

  // H. Desktop Apps: Google Chrome
  if (lower.includes('open chrome') || lower.includes('launch chrome')) {
    if (!actions.some((a) => a.appName === 'Chrome')) {
      actions.push({
        id: `act-chrome-${Date.now()}`,
        type: 'OPEN_APP',
        title: 'Google Chrome',
        appName: 'Chrome',
        url: 'https://www.google.com',
        description: 'Launch Google Chrome application.',
        isNativeRequired: true,
        status: 'pending',
      });
    }
  }

  // I. File Operation: Create Folder
  // e.g. "Create a folder called VAJRA Projects in Documents", "Create a folder called VAJRA Test in Documents"
  const folderMatch = content.match(/create\s+(?:a\s+)?(?:new\s+)?folder\s+(?:called\s+|named\s+)?["']?([^"'\n,]+?)["']?(?:\s+in\s+["']?([^"'\n,]+?)["']?|$)/i);
  if (folderMatch && !actions.some((a) => a.type === 'CREATE_FOLDER')) {
    const folderName = folderMatch[1].trim();
    const parent = folderMatch[2] ? folderMatch[2].trim() : 'Documents';
    const targetPath = `${parent}/${folderName}`;
    actions.push({
      id: `act-mkdir-${Date.now()}`,
      type: 'CREATE_FOLDER',
      title: `Create Folder: "${folderName}"`,
      targetPath,
      description: `Create directory "${folderName}" in ${parent}.`,
      status: 'pending',
    });
  }

  // J. File Operation: Create File
  // e.g. "Create a text file called notes.txt"
  const fileMatch = content.match(/create\s+(?:a\s+)?(?:text\s+)?file\s+(?:called\s+|named\s+)?["']?([^"'\n,]+?)["']?(?:\s+in\s+["']?([^"'\n,]+?)["']?|$)/i);
  if (fileMatch && !actions.some((a) => a.type === 'CREATE_FILE')) {
    const fileName = fileMatch[1].trim();
    const parent = fileMatch[2] ? fileMatch[2].trim() : 'Documents';
    const targetPath = `${parent}/${fileName}`;
    actions.push({
      id: `act-touch-${Date.now()}`,
      type: 'CREATE_FILE',
      title: `Create File: "${fileName}"`,
      targetPath,
      fileContent: '// Created by VAJRA Assistant\n',
      description: `Create text file "${fileName}" in ${parent}.`,
      status: 'pending',
    });
  }

  // K. File Operation: Move File
  // e.g. "Move report.pdf to Documents"
  const moveMatch = content.match(/move\s+["']?([^"'\n,]+?)["']?\s+to\s+["']?([^"'\n,]+?)["']?/i);
  if (moveMatch && !actions.some((a) => a.type === 'MOVE_FILE')) {
    const src = moveMatch[1].trim();
    const dest = moveMatch[2].trim();
    actions.push({
      id: `act-move-${Date.now()}`,
      type: 'MOVE_FILE',
      title: `Move: ${src} → ${dest}`,
      targetPath: src,
      destinationPath: dest,
      description: `Move file "${src}" into "${dest}".`,
      status: 'pending',
    });
  }

  // L. File Operation: Open Specific Folder (e.g. "Open my Downloads folder", "Open Documents")
  const openFolderMatch = content.match(/open\s+(?:my\s+)?(downloads|documents|desktop|pictures|music|videos)(?:\s+folder)?/i);
  if (openFolderMatch && !actions.some((a) => a.type === 'OPEN_PATH')) {
    const folderName = openFolderMatch[1].trim();
    actions.push({
      id: `act-openpath-${Date.now()}`,
      type: 'OPEN_PATH',
      title: `Open ${folderName.charAt(0).toUpperCase() + folderName.slice(1)}`,
      targetPath: folderName,
      description: `Open native ${folderName} folder in Windows File Explorer.`,
      status: 'pending',
    });
  }

  // M. Destructive File Operation: Delete File (e.g. "Delete file report.pdf", "Remove file notes.txt")
  const deleteFileMatch = content.match(/(?:delete|remove)\s+(?:the\s+)?(?:file\s+)?["']?([a-zA-Z0-9_\-.]+\.[a-zA-Z0-9]{1,8})["']?/i);
  if (deleteFileMatch && !actions.some((a) => a.type === 'DELETE_FILE')) {
    const targetFile = deleteFileMatch[1].trim();
    actions.push({
      id: `act-delete-${Date.now()}`,
      type: 'DELETE_FILE',
      title: `Delete File: "${targetFile}"`,
      targetPath: targetFile,
      description: `Permanently delete file "${targetFile}".`,
      requiresConfirmation: true,
      status: 'pending',
    });
  }

  // N. Android Settings Intent (English, Hindi, Hinglish)
  // e.g. "Open Wi-Fi settings", "Wifi ki setting kholo", "Bluetooth open karo", "Open display settings", "Sound settings kholo", "Open settings"
  const isSettingsDirective =
    lower.includes('settings') ||
    lower.includes('setting kholo') ||
    lower.includes('setting open karo') ||
    lower.includes('ki setting');

  if (isSettingsDirective && !actions.some((a) => a.type === 'OPEN_SETTINGS')) {
    let screen: 'wifi' | 'bluetooth' | 'display' | 'sound' | 'battery' | 'apps' | 'accessibility' | 'main' = 'main';
    let title = 'Open Android Settings';

    if (lower.includes('wifi') || lower.includes('wi-fi')) {
      screen = 'wifi';
      title = 'Open Wi-Fi Settings';
    } else if (lower.includes('bluetooth') || lower.includes('bt ')) {
      screen = 'bluetooth';
      title = 'Open Bluetooth Settings';
    } else if (lower.includes('display') || lower.includes('brightness') || lower.includes('screen')) {
      screen = 'display';
      title = 'Open Display Settings';
    } else if (lower.includes('sound') || lower.includes('audio') || lower.includes('volume') || lower.includes('awaaz')) {
      screen = 'sound';
      title = 'Open Sound Settings';
    } else if (lower.includes('battery')) {
      screen = 'battery';
      title = 'Open Battery Settings';
    } else if (lower.includes('accessibility')) {
      screen = 'accessibility';
      title = 'Open Accessibility Settings';
    } else if (lower.includes('app') || lower.includes('application')) {
      screen = 'apps';
      title = 'Open App Settings';
    }

    actions.push({
      id: `act-settings-${Date.now()}`,
      type: 'OPEN_SETTINGS',
      title,
      settingsScreen: screen,
      description: `Open Android ${screen} configuration screen.`,
      status: 'pending',
    });
  }

  // O. Camera Intent (English, Hindi, Hinglish)
  // e.g. "Open camera", "Camera kholo", "Camera chalu karo", "Photo kholo"
  const isCameraDirective =
    lower.includes('open camera') ||
    lower.includes('launch camera') ||
    lower.includes('camera kholo') ||
    lower.includes('camera chalu karo') ||
    lower.includes('camera start karo') ||
    lower === 'camera' ||
    lower.includes('photo kheecho');

  if (isCameraDirective && !actions.some((a) => a.type === 'OPEN_CAMERA')) {
    actions.push({
      id: `act-cam-${Date.now()}`,
      type: 'OPEN_CAMERA',
      title: 'Open Camera',
      description: 'Open device camera application.',
      status: 'pending',
    });
  }

  // P. Phone Dialer Intent (English, Hindi, Hinglish)
  // e.g. "Open dialer", "Dial 9876543210", "Phone lagao 9876543210", "Call 9876543210", "Dialer kholo"
  const phoneMatch = content.match(/(?:dial|call|phone\s+lagao|phone\s+karo)\s+["']?([+0-9\s-]{6,15})["']?/i);
  const isGenericDialer = lower.includes('open dialer') || lower.includes('dialer kholo') || lower === 'dialer';

  if ((phoneMatch || isGenericDialer) && !actions.some((a) => a.type === 'DIAL_PHONE')) {
    const rawNumber = phoneMatch ? phoneMatch[1].replace(/[\s-]/g, '').trim() : '';
    actions.push({
      id: `act-dial-${Date.now()}`,
      type: 'DIAL_PHONE',
      title: rawNumber ? `Dial: ${rawNumber}` : 'Open Dialer',
      phoneNumber: rawNumber,
      description: rawNumber ? `Prefill ${rawNumber} in system dialer.` : 'Open phone dialer.',
      status: 'pending',
    });
  }

  // Q. SMS / Message Drafting Intent (English, Hindi, Hinglish)
  // e.g. "Draft message to 9876543210: Coming soon", "SMS likho 9876543210", "Message draft karo"
  const smsMatch = content.match(/(?:draft\s+(?:message|sms)|sms\s+likho|message\s+likho|message\s+bhejo)\s+(?:to\s+)?([+0-9\s-]{6,15})?(?:\s*[:\-]\s*(.*))?/i);
  const isGenericSms = lower.includes('draft message') || lower.includes('draft sms') || lower.includes('sms kholo');

  if ((smsMatch || isGenericSms) && !actions.some((a) => a.type === 'DRAFT_SMS')) {
    const targetPhone = smsMatch && smsMatch[1] ? smsMatch[1].replace(/[\s-]/g, '').trim() : '';
    const messageBody = smsMatch && smsMatch[2] ? smsMatch[2].trim() : '';
    actions.push({
      id: `act-sms-${Date.now()}`,
      type: 'DRAFT_SMS',
      title: targetPhone ? `Draft SMS: ${targetPhone}` : 'Draft Message',
      phoneNumber: targetPhone,
      messageText: messageBody,
      description: `Draft SMS to ${targetPhone || 'recipient'} for user review.`,
      status: 'pending',
    });
  }

  // R. Volume Adjustment Intent (English, Hindi, Hinglish)
  // e.g. "Volume up", "Awaaz badhao", "Volume down", "Awaaz kam karo", "Mute karo", "Mute audio"
  const isVolUp = lower.includes('volume up') || lower.includes('awaaz badhao') || lower.includes('awaj badhao');
  const isVolDown = lower.includes('volume down') || lower.includes('awaaz kam karo') || lower.includes('awaj kam karo');
  const isVolMute = lower.includes('mute audio') || lower.includes('mute karo') || lower === 'mute';

  if ((isVolUp || isVolDown || isVolMute) && !actions.some((a) => a.type === 'ADJUST_VOLUME')) {
    const dir: 'up' | 'down' | 'mute' = isVolMute ? 'mute' : isVolDown ? 'down' : 'up';
    actions.push({
      id: `act-vol-${Date.now()}`,
      type: 'ADJUST_VOLUME',
      title: `Volume: ${dir.toUpperCase()}`,
      volumeDirection: dir,
      description: `Adjust media audio volume: ${dir}.`,
      status: 'pending',
    });
  }

  // S. Device & Battery Info Intent (English, Hindi, Hinglish)
  // e.g. "Battery status kya hai", "Battery level batao", "Device status batao", "Phone information"
  const isDeviceInfoDirective =
    lower.includes('battery status') ||
    lower.includes('battery level') ||
    lower.includes('battery kitni hai') ||
    lower.includes('device status') ||
    lower.includes('phone information');

  if (isDeviceInfoDirective && !actions.some((a) => a.type === 'GET_DEVICE_INFO')) {
    actions.push({
      id: `act-devinfo-${Date.now()}`,
      type: 'GET_DEVICE_INFO',
      title: 'Device & Battery Telemetry',
      description: 'Check battery percentage, charging state, and network connectivity.',
      status: 'pending',
    });
  }

  // T. Internal Notes Management Intent (English, Hindi, Hinglish)
  // e.g. "Save note: buy groceries", "Mera note save karo: milk", "Notes dikhao", "Clear notes"
  const saveNoteMatch = content.match(/(?:save\s+note|add\s+note|note\s+save\s+karo|note\s+likho)\s*[:\-]?\s*(.*)/i);
  const isListNotes = lower.includes('notes dikhao') || lower.includes('show notes') || lower.includes('list notes');
  const isClearNotes = lower.includes('clear notes') || lower.includes('saare notes delete karo');

  if ((saveNoteMatch || isListNotes || isClearNotes) && !actions.some((a) => a.type === 'MANAGE_VAJRA_NOTE')) {
    if (isClearNotes) {
      actions.push({
        id: `act-note-${Date.now()}`,
        type: 'MANAGE_VAJRA_NOTE',
        title: 'Clear Notes',
        noteAction: 'delete',
        description: 'Delete all notes from memory.',
        status: 'pending',
      });
    } else if (isListNotes) {
      actions.push({
        id: `act-note-${Date.now()}`,
        type: 'MANAGE_VAJRA_NOTE',
        title: 'Read Notes',
        noteAction: 'list',
        description: 'Read saved scratchpad notes.',
        status: 'pending',
      });
    } else if (saveNoteMatch) {
      const noteContent = saveNoteMatch[1]?.trim() || 'Untitled Note';
      actions.push({
        id: `act-note-${Date.now()}`,
        type: 'MANAGE_VAJRA_NOTE',
        title: `Save Note: "${noteContent.slice(0, 25)}"`,
        noteAction: 'create',
        noteTitle: noteContent.slice(0, 30),
        noteBody: noteContent,
        description: `Persist note to VAJRA scratchpad: "${noteContent}".`,
        status: 'pending',
      });
    }
  }

  // U. Emergency Global Stop Intent (English, Hindi, Hinglish)
  // e.g. "Emergency stop", "Sab band karo", "Stop everything"
  const isEmergencyStop =
    lower.includes('emergency stop') ||
    lower.includes('sab band karo') ||
    lower.includes('stop everything');

  if (isEmergencyStop && !actions.some((a) => a.type === 'GLOBAL_STOP')) {
    actions.push({
      id: `act-stop-${Date.now()}`,
      type: 'GLOBAL_STOP',
      title: 'Emergency Global Stop',
      description: 'Halt all speech, active plans, and assistive operations immediately.',
      status: 'pending',
    });
  }

  return { cleanedText, actions };
}
