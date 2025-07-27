// ===== LEAFLET CONFIGURATION =====
// Edit this file to easily customize the leaflet content

const LEAFLET_CONFIG = {
    // Business Information
    business: {
        name: "T&S BOUNCY CASTLE HIRE",
        tagline: "🎉 Making Your Events Unforgettable! 🎉",
        location: "Proudly Serving Edwinstowe & Surrounding Areas",
        phone: "07835 094187",
        email: "tsbouncycastlehire@gmail.com",
        logoPath: "../tands_logo.png"
    },

    // Hero Section
    hero: {
        badge: "🏰 NEW BUSINESS LAUNCH! 🏰",
        title: "The Best Bouncy Castles Have Arrived!",
        description: "Professional, safe, and incredibly fun bouncy castles for all your celebrations. From birthday parties to family gatherings - we bring the excitement to you!"
    },

    // Features (Front Page)
    features: [
        {
            icon: "✅",
            title: "Fully Insured",
            subtitle: "Complete peace of mind"
        },
        {
            icon: "🧼",
            title: "Spotlessly Clean",
            subtitle: "Sanitized before every hire"
        },
        {
            icon: "🚚",
            title: "Free Delivery",
            subtitle: "Setup & collection included"
        },
        {
            icon: "🛡️",
            title: "Safety Tested",
            subtitle: "PIPA certified equipment"
        }
    ],

    // Call to Action
    cta: {
        title: "🎪 BOOK NOW & SAVE! 🎪",
        text: "Call today for instant quotes and availability!",
        phone: "📞 07835 094187"
    },

    // Castle Fleet (Back Page)
    castles: [
        {
            name: "👑 Princess Palace",
            size: "15ft x 15ft",
            description: "Magical castle perfect for little princesses!",
            price: "£75/day"
        },
        {
            name: "🦸 Superhero Base",
            size: "14ft x 14ft",
            description: "Action-packed fun for aspiring heroes!",
            price: "£70/day"
        },
        {
            name: "🌴 Jungle Adventure",
            size: "12ft x 18ft + slide",
            description: "Wild adventure with bonus slide!",
            price: "£80/day"
        },
        {
            name: "🎉 Classic Fun",
            size: "12ft x 15ft",
            description: "Timeless design, endless smiles!",
            price: "£60/day"
        },
        {
            name: "🌊 Under The Sea",
            size: "15ft x 16ft",
            description: "Dive into underwater adventures!",
            price: "£75/day"
        },
        {
            name: "🎈 Party Time",
            size: "10ft x 12ft",
            description: "Perfect for smaller garden parties!",
            price: "£55/day"
        }
    ],

    // Why Choose Us
    whyChooseUs: {
        title: "🌟 Why Choose T&S Bouncy Castle Hire? 🌟",
        reasons: [
            {
                icon: "🏠",
                text: "Local Edwinstowe family business"
            },
            {
                icon: "⭐",
                text: "Brand new, premium equipment"
            },
            {
                icon: "💰",
                text: "Competitive prices from £55/day"
            },
            {
                icon: "📞",
                text: "Available 7 days a week"
            },
            {
                icon: "🚀",
                text: "Quick setup & collection"
            },
            {
                icon: "❤️",
                text: "Friendly, reliable service"
            }
        ]
    },

    // Service Areas
    serviceArea: {
        title: "📍 Areas We Cover",
        areas: [
            "Edwinstowe", "Ollerton", "Clipstone", "Bilsthorpe", "Rufford",
            "Walesby", "New Ollerton", "Boughton", "Kirton", "Eakring"
        ],
        note: "Don't see your area? Give us a call - we may still be able to help!"
    },

    // Bottom Contact
    bottomContact: {
        title: "📞 BOOK TODAY!",
        phone: "07835 094187",
        email: "tsbouncycastlehire@gmail.com",
        websiteNote: "🌐 Visit our website for more photos and online booking!"
    },

    // Colors (CSS Custom Properties)
    colors: {
        primary: "#667eea",
        secondary: "#764ba2",
        accent: "#f093fb",
        success: "#00b894",
        warning: "#feca57",
        danger: "#ff6b6b"
    }
};

// Export for use in other files (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LEAFLET_CONFIG;
} 