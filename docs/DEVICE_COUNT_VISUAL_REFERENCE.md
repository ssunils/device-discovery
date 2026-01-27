# Device Count Display - Visual Reference

## 1. Target Device Card

### Before
```
┌─────────────────────────────────────────────────┐
│ Target Devices                                  │
│ ───────────────────────────────────────────────│
│ [Device 1] Android        ONLINE                │
│ [Device 2] iOS            OFFLINE               │
│ [Device 3] Unknown        ONLINE                │
└─────────────────────────────────────────────────┘
```

### After
```
┌─────────────────────────────────────────────────┐
│ Target Devices                 [3 Connected]   │
│ ───────────────────────────────────────────────│
│ [Device 1] Android        ONLINE                │
│ [Device 2] iOS            OFFLINE               │
│ [Device 3] Unknown        ONLINE                │
└─────────────────────────────────────────────────┘
```

**Badge Styling:**
- Background: `bg-blue-500/10` (semi-transparent blue)
- Border: `border-blue-500/30` (subtle blue border)
- Text: `text-blue-400` (light blue)
- Font: Bold, uppercase, uppercase spacing
- Padding: `px-2.5 py-1`
- Size: Small (`text-xs`)

---

## 2. History Sidebar Entry

### Before
```
┌──────────────────────────────────────┐
│ 🇦🇪 +971 585 884 950               │
│ whatsapp · 33 events                │
└──────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────┐
│ 🇦🇪 +971 585 884 950               │
│ whatsapp · 33 events  [3 Devices]   │
└──────────────────────────────────────┘
```

**Badge Styling:**
- Background: `bg-blue-500/20` (slightly more opaque blue)
- Border: `border-blue-500/30`
- Text: `text-blue-400`
- Font: Bold, uppercase, extra tracking (`tracking-widest`)
- Padding: `px-1.5 py-0.5`
- Size: Very small (`text-[8px]`)
- Line break: Wraps to next line on mobile

---

## 3. History Detail Panel

### Before
```
┌──────────────────────────────────────┐
│ Detail View                          │
│                                      │
│ 🇦🇪 +971 585 884 950               │
│ whatsapp · 33 sessions              │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Status: ONLINE                   │ │
│ │ Device: iPhone                   │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────┐
│ Detail View                          │
│                                      │
│ 🇦🇪 +971 585 884 950               │
│ whatsapp · 33 sessions               │
│                          [3 Devices] │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Status: ONLINE                   │ │
│ │ Device: iPhone                   │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**Badge Styling:**
- Background: `bg-blue-500/20`
- Border: `border-blue-500/30` rounded-lg
- Text: `text-blue-400`
- Font: Bold, uppercase, extra tracking
- Padding: `px-2 py-0.5`
- Size: Small-medium (`text-[9px]`)
- Text: "X Connected Device(s)"

---

## Color Scheme

### Blue Accent Palette
```
Primary Text:     text-blue-400     (#60a5fa)
Light Text:       text-blue-500     (#3b82f6)
Background:       bg-blue-500/20    (#3b82f6 @ 20% opacity)
Border:           border-blue-500/30 (#3b82f6 @ 30% opacity)

Example Badge:
┌─────────────────────────┐
│ 3 Devices               │  ← text-blue-400
│                         │  ← bg-blue-500/20
└─────────────────────────┘
      border-blue-500/30
```

---

## Responsive Behavior

### Desktop (md and above)
- Full badge display on same line
- Larger text sizes
- Full spacing

### Mobile (below md)
- Badge may wrap to next line due to screen width
- Flex wrap enabled: `flex-wrap`
- Gap spacing: `gap-2`
- Text remains readable

**Example Mobile:**
```
+971 585 884 950
whatsapp · 33 events
[3 Devices]
```

---

## Data Flow

### Device Count Source

**ContactCard:**
```
Props: deviceCount (number)
       devices: DeviceInfo[]
       
Display: {devices.length > 0 
           ? `${devices.length} Connected` 
           : 'No Devices'}
```

**History Entry:**
```
Data: entry.latestEvent.data?.deviceCount
Display: Only if deviceCount is defined
Format: "{count} Device{s}"
```

**History Detail:**
```
Data: selectedEntry.latestEvent.data?.deviceCount
Display: Only if deviceCount is defined
Format: "{count} Connected Device{s}"
```

---

## Example Outputs

### With 1 Device
```
ContactCard:  "1 Connected"
History:      "1 Device"
Detail:       "1 Connected Device"
```

### With 3 Devices
```
ContactCard:  "3 Connected"
History:      "3 Devices"
Detail:       "3 Connected Devices"
```

### With No Data
```
ContactCard:  "No Devices"
History:      [badge hidden]
Detail:       [badge hidden]
```

---

## CSS Classes Used

```css
/* Container */
.flex.items-center.justify-between.mb-3
.flex.items-center.gap-2.flex-wrap
.flex.items-center.gap-2.flex-wrap.mt-1

/* Badge */
.text-xs.font-black.px-2.5.py-1.rounded-lg
.bg-blue-500/10.border.border-blue-500/30
.text-blue-400.uppercase.tracking-widest

.text-[8px].font-black.px-1.5.py-0.5.rounded
.bg-blue-500/20.text-blue-400.uppercase
.tracking-widest.border.border-blue-500/30

.text-[9px].font-black.px-2.py-0.5.rounded-lg
.bg-blue-500/20.text-blue-400.uppercase
.tracking-widest.border.border-blue-500/30
```

---

**Updated:** January 27, 2026
**Component Version:** 1.0
