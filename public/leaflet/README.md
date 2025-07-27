# 🎪 T&S Bouncy Castle Hire - A5 Leaflet

A professional, print-ready A5 leaflet designed for door-to-door distribution to promote T&S Bouncy Castle Hire's launch in Edwinstowe.

## 📄 Files Overview

- **`index.html`** - Main leaflet HTML structure
- **`leaflet-styles.css`** - Complete styling optimized for A5 printing
- **`leaflet-config.js`** - Easy-to-edit configuration file for all content
- **`README.md`** - This instruction file

## 🖨️ Printing Instructions

### Printer Settings
- **Paper Size:** A5 (148mm x 210mm)
- **Orientation:** Portrait
- **Print Quality:** High/Best quality recommended
- **Margins:** Minimum (3mm recommended)
- **Double-sided:** Yes (flip on short edge)
- **Color:** Full color for best impact

### Steps to Print
1. Open `index.html` in your web browser
2. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac) to print
3. Or click the "🖨️ Print Leaflet" button at the bottom
4. Select A5 paper size in printer settings
5. Choose "Print on both sides" (short edge flip)
6. Print a test copy first to check alignment

## ✏️ Easy Customization

### Quick Content Changes
Edit the `leaflet-config.js` file to modify:

**Business Information:**
```javascript
business: {
    name: "T&S BOUNCY CASTLE HIRE",
    phone: "07835 094187",
    email: "tsbouncycastlehire@gmail.com",
    // ... other details
}
```

**Castle Prices:**
```javascript
castles: [
    {
        name: "👑 Princess Palace",
        price: "£75/day"  // Change price here
    }
    // ... other castles
]
```

**Service Areas:**
```javascript
serviceArea: {
    areas: [
        "Edwinstowe", "Ollerton", "Clipstone"
        // Add or remove areas here
    ]
}
```

### Design Changes

**Colors:** Edit the CSS custom properties in `leaflet-styles.css`:
```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --accent-color: #f093fb;
}
```

**Fonts:** Change fonts by editing the Google Fonts import in `index.html`

**Layout:** Modify spacing and sizing in `leaflet-styles.css`

## 🎨 Design Features

### Front Side
- **Eye-catching header** with logo and business name
- **"NEW BUSINESS LAUNCH" badge** to create urgency
- **Key features grid** highlighting USPs
- **Contact information** prominently displayed
- **Strong call-to-action** with phone number

### Back Side
- **Complete castle fleet** with prices
- **"Why Choose Us" section** with trust signals
- **Service area coverage** map
- **Multiple contact methods**
- **Website promotion**

## 📱 Responsive Design

The leaflet includes responsive scaling for different screen sizes:
- Scales down on smaller screens for preview
- Maintains exact A5 dimensions when printing
- Mobile-friendly for digital viewing

## 🔧 Technical Notes

### Print Optimization
- Uses millimeter units for precise A5 sizing
- `print-color-adjust: exact` ensures colors print properly
- Page breaks configured for double-sided printing
- High contrast text for readability

### Browser Compatibility
- Works in all modern browsers
- Chrome recommended for best print results
- Safari and Firefox also supported

## 📋 Content Checklist

Before printing, verify:
- [ ] Phone number is correct
- [ ] Email address is current
- [ ] Castle prices are up-to-date
- [ ] Service areas are accurate
- [ ] Logo displays properly
- [ ] All text is spelled correctly

## 🚀 Distribution Tips

### Target Areas
- Residential streets in Edwinstowe
- Family neighborhoods with children
- Areas near schools and parks
- New housing developments

### Best Times
- Weekend mornings (9-11 AM)
- After school hours (3-5 PM)
- Avoid early mornings or late evenings

### Quantity Planning
- Print 500-1000 for initial launch
- Keep extras for events and referrals
- Consider seasonal reprints

## 📞 Support

For technical issues or customization help:
- Check the CSS comments for guidance
- Test print on regular paper first
- Contact your web developer for major changes

## 📈 Tracking Success

Consider adding:
- Unique phone number for leaflet responses
- Special discount code for leaflet customers
- QR code linking to website (future enhancement)

---

**Created for T&S Bouncy Castle Hire**  
*Professional leaflet design optimized for A5 printing and maximum impact* 