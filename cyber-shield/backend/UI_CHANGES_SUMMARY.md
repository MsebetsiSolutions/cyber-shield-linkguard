# UI Changes Summary

## What Was Changed

### Alerts Page (`public/soc/pages/alerts.html`)

**Added 3 New Buttons** to the existing Bulk Actions section:

```html
<button class="btn sm" id="bulkClassify"><i class="bi bi-cpu"></i> Classify (IOC/IOA)</button>
<button class="btn sm" id="bulkIODEF"><i class="bi bi-file-earmark-code"></i> Generate IODEF</button>
<button class="btn sm" id="bulkOpenCTI"><i class="bi bi-cloud-upload"></i> Send to OpenCTI</button>
```

**Added JavaScript Functions** (at bottom of file):
- `classifySelected()` - Classifies selected alerts
- `displayClassificationResults()` - Shows results in modal
- `generateIODEFForSelected()` - Creates IODEF XML reports
- `sendToOpenCTI()` - Submits to threat intelligence platform

## What Was NOT Changed

✅ **Original Layout** - All cards, filters, and tabs remain exactly the same
✅ **Original Styling** - No CSS changes, uses existing button classes
✅ **Original Functionality** - All existing buttons and features work as before
✅ **Table Structure** - Alert table columns and display unchanged
✅ **Existing Buttons** - All 8 original bulk action buttons preserved
✅ **Filters Section** - Search, severity, status, owner filters untouched
✅ **Tabs** - Overview, Risk, Enrichment, Correlation, Whitelist tabs intact
✅ **Drawer** - Alert details drawer functionality unchanged

## Visual Integration

The new buttons:
- Use the same `btn sm` and `btn sm ghost` classes as existing buttons
- Appear in the same row with existing bulk actions
- Use Bootstrap Icons (bi-cpu, bi-file-earmark-code, bi-cloud-upload)
- Follow the same spacing and styling patterns
- Wrap naturally with existing buttons (flex-wrap)

## Backend Changes

Created new backend modules (do not affect UI):
- `backend/ioc_detector.py` - IOC/IOA detection engine
- `backend/iodef_generator.py` - RFC 7970 XML generator
- `backend/opencti_integration.py` - OpenCTI client

Enhanced existing file:
- `backend/routes_alerts.py` - Added 7 new API endpoints

Database changes:
- Added 7 new columns to alerts table (transparent to UI)

## Result

The UI looks **exactly the same** as before, with 3 new buttons that blend seamlessly into the existing design. All original functionality is preserved and enhanced.

## Server Access

- **New Port:** http://127.0.0.1:5001 (changed from 5000 due to port conflict)
- **Alerts Page:** http://127.0.0.1:5001/pages/alerts.html
