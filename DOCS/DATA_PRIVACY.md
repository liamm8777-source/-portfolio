# Data Privacy Guarantees

## Core Promise
**Your data never leaves your browser. Period.**

## Data Flow

```
User Input
    ↓
Browser Memory (Signals)
    ↓
Local AI Model (WebAssembly)
    ↓
Browser Memory (Results)
    ↓
Display to User
    ↓
[Optional] IndexedDB (local storage only)
```

**At NO point does data touch any server.**

## What We Store

### In Memory (Temporary)
- Current conversation/session
- User input text
- AI responses
- UI state

**Lifetime:** Until page refresh or explicit clear

### In IndexedDB (Optional, Persistent)
- Conversation history (if user enables)
- User preferences
- Downloaded AI models

**Location:** Local browser storage only  
**Access:** Only this application  
**Encrypted:** Optional user-controlled encryption  

### What We DON'T Store
❌ No cookies  
❌ No tracking data  
❌ No analytics  
❌ No user identifiers  
❌ No device fingerprints  
❌ No IP addresses  
❌ No usage statistics  

## Data Lifecycle

### Creation
```typescript
// User types input
userInput = signal<string>('');

// Stored in memory only
effect(() => {
  const input = this.userInput();
  // Process locally
  this.processLocally(input);
});
```

### Processing
```typescript
// All processing happens locally
async processLocally(input: string): Promise<string> {
  // Load local model
  const model = await this.localAI.getModel();
  
  // Run inference locally
  const result = await model.generate(input);
  
  // Return to user
  return result;
}
```

### Storage (If Enabled)
```typescript
// Only with explicit user consent
async saveToLocal(data: string): Promise<void> {
  if (!this.userConsentedToLocalStorage()) {
    return; // Don't save
  }
  
  // Save to IndexedDB (local only)
  await this.db.put('conversations', {
    id: crypto.randomUUID(),
    data: data,
    timestamp: Date.now()
  });
}
```

### Deletion
```typescript
// Automatic on component destroy
ngOnDestroy(): void {
  // Clear sensitive data from memory
  this.userInput.set('');
  this.responses.set([]);
  
  // Optional: Clear from IndexedDB
  if (this.userRequestsClear) {
    this.db.clear('conversations');
  }
}
```

## User Control

### Privacy Settings
Users can control:
- ✅ Enable/disable conversation history
- ✅ Clear all data on exit
- ✅ Manual data deletion
- ✅ Export data (local download only)
- ✅ Encrypt stored data (local key)

### Transparency
The UI clearly shows:
- "🔒 All processing is local"
- "🌐 No internet connection used"
- "🗑️ Click to clear all data"

## Technical Safeguards

### 1. No Global State Leaks
```typescript
// BAD: Global variables can leak
window.userData = data; // ❌ NEVER

// GOOD: Encapsulated in services
@Injectable()
export class DataService {
  private data = signal<string>(''); // ✅ Local to service
}
```

### 2. Memory Management
```typescript
// Clear sensitive data immediately
export class SecureComponent implements OnDestroy {
  private sensitiveData = signal<string>('');
  
  ngOnDestroy(): void {
    // Overwrite with garbage before clearing
    this.sensitiveData.set('x'.repeat(1000));
    this.sensitiveData.set('');
  }
}
```

### 3. No Logging of Sensitive Data
```typescript
// BAD: Logs user data
console.log('User input:', userInput); // ❌ NEVER in production

// GOOD: Generic logging only
console.log('Processing started'); // ✅ No sensitive info
```

### 4. Sanitization
```typescript
// Always sanitize user input
constructor(private sanitizer: DomSanitizer) {}

displayUserInput(input: string): SafeHtml {
  return this.sanitizer.sanitize(SecurityContext.HTML, input) || '';
}
```

## Compliance

### GDPR
- ✅ No personal data collected
- ✅ No data processing outside device
- ✅ User has full control
- ✅ Right to erasure built-in
- ✅ Data portability (local export)

### CCPA
- ✅ No personal information sold
- ✅ No personal information shared
- ✅ No personal information collected

### HIPAA
- ✅ No PHI transmitted
- ✅ No PHI stored on servers
- ✅ Local processing only
- ✅ Can be used in healthcare settings

## Threat Mitigation

### Browser Extensions
**Risk:** Malicious extensions could read page content  
**Mitigation:** 
- Use ShadowDOM where possible
- Clear data frequently
- Warn users about extension risks

### Memory Dumps
**Risk:** Advanced attacks could dump browser memory  
**Mitigation:**
- Clear sensitive data immediately after use
- Overwrite memory before freeing
- Keep sensitive data lifetime minimal

### XSS Attacks
**Risk:** Injected scripts could steal data  
**Mitigation:**
- Angular's automatic XSS protection
- DomSanitizer for all user content
- CSP headers prevent inline scripts

## Audit Trail

We do NOT keep audit trails because:
1. Privacy first - no tracking
2. Local-only - no compliance requirement
3. User trust - zero surveillance

If needed for debugging:
- Logs stay in browser console only
- Never persisted
- Never transmitted

## User Education

**We will clearly communicate:**
- How data stays local
- What happens to their input
- Where models are stored
- How to verify privacy claims
- How to delete all data

## Verification

Users can verify our claims by:
1. Disconnecting from internet - app still works
2. Checking DevTools Network tab - zero requests
3. Inspecting source code - it's all there
4. Using browser storage inspector - only local data

## Summary

**Privacy by Design:**
- No collection
- No transmission  
- No tracking
- Full user control
- Complete transparency

**This is the most private AI experience possible.**
