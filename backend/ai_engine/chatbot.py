"""
Simple chatbot assistant for CivicAI.
Helps users report issues by guiding them through the process.
"""

import re

# Intent patterns and responses
INTENTS = [
    {
        'patterns': [r'hi|hello|hey|greetings|good\s*(morning|afternoon|evening)'],
        'responses': [
            "Hello! I'm the CivicAI assistant. I can help you report civic issues, "
            "check issue status, or answer questions about our platform. How can I help you today?"
        ]
    },
    {
        'patterns': [r'how\s*(do i|to|can i)\s*report|submit\s*(an|a)?\s*issue|file\s*(a|an)?\s*complaint'],
        'responses': [
            "To report a civic issue:\n"
            "1. Click 'Report Issue' from the navigation menu\n"
            "2. Enter a clear title describing the problem\n"
            "3. Add a detailed description\n"
            "4. Select or let our AI detect the category\n"
            "5. Upload a photo if possible (it helps!)\n"
            "6. Set your location using GPS or enter it manually\n"
            "7. Click Submit!\n\n"
            "Your issue will be automatically classified and prioritized by our AI system."
        ]
    },
    {
        'patterns': [r'status|track|check|where\s*is\s*my|progress|update'],
        'responses': [
            "To check your issue status:\n"
            "1. Go to 'My Issues' from your dashboard\n"
            "2. You'll see all your reported issues with their current status\n"
            "3. Statuses include: Pending, In Progress, and Resolved\n\n"
            "You'll also receive notifications when your issue status changes."
        ]
    },
    {
        'patterns': [r'categor|type|kind|what\s*(issues|problems|complaints)'],
        'responses': [
            "We handle these categories of civic issues:\n"
            "• Road & Pothole - Road damage, potholes, broken sidewalks\n"
            "• Garbage & Waste - Uncollected garbage, overflowing bins\n"
            "• Water & Drainage - Water leaks, drainage issues, flooding\n"
            "• Electricity & Streetlight - Power outages, broken streetlights\n"
            "• Sanitation & Hygiene - Public toilet issues, cleanliness\n"
            "• Noise Pollution - Excessive noise complaints\n"
            "• Encroachment - Illegal occupation of public spaces\n"
            "• Traffic & Signals - Traffic signal issues, parking problems\n"
            "• Parks & Public Spaces - Park maintenance issues\n\n"
            "Our AI will automatically suggest the right category!"
        ]
    },
    {
        'patterns': [r'pothole|road\s*damage|broken\s*road|street\s*damage'],
        'responses': [
            "For reporting a pothole or road damage:\n"
            "• Take a clear photo of the damage\n"
            "• Note the exact location (road name, nearby landmark)\n"
            "• Describe the size and severity\n"
            "• Mention if it's causing danger to vehicles/pedestrians\n\n"
            "Go to 'Report Issue' and our AI will classify it automatically!"
        ]
    },
    {
        'patterns': [r'garbage|trash|waste|dump|rubbish|dirty'],
        'responses': [
            "For garbage/waste related issues:\n"
            "• Specify if it's uncollected garbage, illegal dumping, or overflowing bins\n"
            "• Note how long the issue has persisted\n"
            "• Upload a photo for quick action\n"
            "• Provide the exact location\n\n"
            "Report it through the 'Report Issue' page and we'll prioritize it!"
        ]
    },
    {
        'patterns': [r'water|leak|pipe|drain|flood|supply'],
        'responses': [
            "For water or drainage issues:\n"
            "• Describe whether it's a leak, supply problem, or drainage issue\n"
            "• Note the severity (minor leak vs. major flooding)\n"
            "• Mention if it's affecting multiple households\n"
            "• Upload photos showing the issue\n\n"
            "Use 'Report Issue' to submit and the system will prioritize it!"
        ]
    },
    {
        'patterns': [r'light|electric|power|blackout|outage|streetlight'],
        'responses': [
            "For electricity/streetlight issues:\n"
            "• Mention if it's a broken streetlight, power outage, or exposed wires\n"
            "• Note if there's any safety hazard\n"
            "• Provide exact pole number or location\n"
            "• Add photos if safely possible\n\n"
            "Submit through 'Report Issue' — dangerous electrical issues get higher priority!"
        ]
    },
    {
        'patterns': [r'upvote|vote|support|similar|already\s*reported'],
        'responses': [
            "If you find an issue similar to yours:\n"
            "• Click the upvote button on the existing issue\n"
            "• This increases its priority automatically\n"
            "• Our AI detects duplicates when you report an issue\n"
            "• Higher upvotes = faster resolution!\n\n"
            "You can also add a comment with additional details."
        ]
    },
    {
        'patterns': [r'priority|urgent|emergency|important|how\s*long'],
        'responses': [
            "Our AI prioritizes issues based on:\n"
            "• Severity of the problem (safety hazards get top priority)\n"
            "• Number of upvotes from citizens\n"
            "• Location density (issues in busy areas get priority)\n"
            "• Keywords indicating urgency\n\n"
            "Priority levels: Low → Medium → High → Critical\n"
            "Critical issues are addressed first!"
        ]
    },
    {
        'patterns': [r'thank|thanks|thx|appreciate'],
        'responses': [
            "You're welcome! If you need any more help, feel free to ask. "
            "Together we can make our community better! 🏙️"
        ]
    },
    {
        'patterns': [r'bye|goodbye|exit|quit|close'],
        'responses': [
            "Goodbye! Remember, your civic participation matters. "
            "Don't hesitate to report issues — every report helps improve our community!"
        ]
    },
    {
        'patterns': [r'contact|support|help\s*desk|phone|email'],
        'responses': [
            "For additional support:\n"
            "• Use this chatbot for quick guidance\n"
            "• Report issues directly through the platform\n"
            "• Check the 'My Issues' section for updates\n\n"
            "All issues are tracked and managed by area administrators."
        ]
    },
]

DEFAULT_RESPONSE = (
    "I'm not sure I understand. I can help you with:\n"
    "• Reporting a civic issue\n"
    "• Checking issue status\n"
    "• Understanding issue categories\n"
    "• Learning about priority levels\n"
    "• Tips for better issue reporting\n\n"
    "Try asking something like 'How do I report an issue?' or 'What categories are available?'"
)


def get_chatbot_response(message):
    """Get a response from the chatbot based on the user's message."""
    message_lower = message.lower().strip()

    for intent in INTENTS:
        for pattern in intent['patterns']:
            if re.search(pattern, message_lower):
                return intent['responses'][0]

    return DEFAULT_RESPONSE
