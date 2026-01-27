// Frontend automation service for manual mode
// This would inject scripts into the user's browser for manual trigger mode

export class FrontendAutomationService {
  async injectOverlay() {
    // Create overlay UI for manual mode
    const overlay = document.createElement('div');
    overlay.id = 'apply-matrix-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 16px;
      z-index: 999999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    overlay.innerHTML = `
      <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Apply Matrix</h3>
      <button id="am-start" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
        margin-bottom: 8px;
      ">Start Automation</button>
      <button id="am-stop" style="
        background: #ef4444;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
      ">Stop</button>
    `;
    
    document.body.appendChild(overlay);
    
    return {
      startButton: document.getElementById('am-start'),
      stopButton: document.getElementById('am-stop'),
      remove: () => overlay.remove(),
    };
  }

  async detectFormFields(): Promise<any[]> {
    const fields: any[] = [];
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach((input) => {
      const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      const name = element.getAttribute('name') || 
                  element.getAttribute('id') || 
                  element.getAttribute('placeholder') || 
                  'unknown';
      
      fields.push({
        selector: element.id ? `#${element.id}` : `[name="${element.getAttribute('name')}"]`,
        name,
        type: element.tagName === 'SELECT' ? 'select' : 
             element.tagName === 'TEXTAREA' ? 'textarea' : 
             (element as HTMLInputElement).type || 'text',
        element,
      });
    });
    
    return fields;
  }

  async fillField(selector: string, value: string) {
    const element = document.querySelector(selector) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!element) return false;

    if (element.tagName === 'SELECT') {
      (element as HTMLSelectElement).value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      (element as HTMLInputElement | HTMLTextAreaElement).value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    return true;
  }
}

export const frontendAutomationService = new FrontendAutomationService();

