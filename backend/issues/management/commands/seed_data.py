"""
Management command to seed the database with demo data.
Creates demo users (super_admin, area_admin, user) and sample issues.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from issues.models import Issue, Comment, Vote
from notifications.models import Notification
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

SAMPLE_ISSUES = [
    {
        'title': 'Large pothole on MG Road near City Mall',
        'description': 'There is a large pothole approximately 2 feet wide on MG Road right near the entrance to City Mall. Multiple vehicles have been damaged. This is a dangerous hazard especially at night when visibility is poor. Several accidents have occurred here in the past week.',
        'category': 'road',
        'latitude': 18.5204,
        'longitude': 73.8567,
        'address': 'MG Road, near City Mall, Pune',
        'priority': 'high',
        'status': 'in_progress',
    },
    {
        'title': 'Garbage not collected for 5 days in Sector 21',
        'description': 'The garbage collection truck has not visited Sector 21 for the past 5 days. The bins are overflowing and there is a terrible smell. Stray dogs are scattering waste everywhere. Residents are very unhappy with the situation.',
        'category': 'garbage',
        'latitude': 18.5314,
        'longitude': 73.8446,
        'address': 'Sector 21, Nigdi, Pune',
        'priority': 'high',
        'status': 'pending',
    },
    {
        'title': 'Water pipeline leaking on Station Road',
        'description': 'A major water pipeline is leaking near the bus station on Station Road. Water has been flowing continuously for 3 days now, causing waterlogging and wastage. The road has become slippery and muddy.',
        'category': 'water',
        'latitude': 18.5285,
        'longitude': 73.8745,
        'address': 'Station Road, near Bus Stand, Pune',
        'priority': 'critical',
        'status': 'pending',
    },
    {
        'title': 'Streetlights not working in Gandhi Nagar',
        'description': 'All streetlights on the main road of Gandhi Nagar colony have been non-functional for the past 2 weeks. The area becomes completely dark after sunset, creating safety concerns especially for women and elderly residents.',
        'category': 'electricity',
        'latitude': 18.5150,
        'longitude': 73.8300,
        'address': 'Gandhi Nagar Main Road, Pune',
        'priority': 'high',
        'status': 'in_progress',
    },
    {
        'title': 'Overflowing drainage in Kothrud Market',
        'description': 'The drainage system near Kothrud Market is completely blocked and overflowing. Dirty water is flowing on the road making it impossible for pedestrians and shopkeepers. The foul smell is unbearable.',
        'category': 'water',
        'latitude': 18.5074,
        'longitude': 73.8077,
        'address': 'Kothrud Market Area, Pune',
        'priority': 'medium',
        'status': 'pending',
    },
    {
        'title': 'Illegal construction blocking public footpath',
        'description': 'A shop owner has illegally extended their shop onto the public footpath near Laxmi Road. Pedestrians are forced to walk on the busy road, which is extremely dangerous. This encroachment has been going on for months.',
        'category': 'encroachment',
        'latitude': 18.5196,
        'longitude': 73.8553,
        'address': 'Laxmi Road, Pune',
        'priority': 'medium',
        'status': 'pending',
    },
    {
        'title': 'Broken traffic signal at Swargate junction',
        'description': 'The traffic signal at the main Swargate junction has been blinking yellow for 3 days. This is causing severe traffic congestion and near-miss accidents during peak hours. Urgent repair needed.',
        'category': 'traffic',
        'latitude': 18.5018,
        'longitude': 73.8636,
        'address': 'Swargate Junction, Pune',
        'priority': 'critical',
        'status': 'in_progress',
    },
    {
        'title': 'Public toilet in very poor condition at Deccan',
        'description': 'The public toilet facility near Deccan Gymkhana is in extremely poor sanitary condition. No water supply, broken doors, and very unhygienic. It needs immediate cleaning and repair.',
        'category': 'sanitation',
        'latitude': 18.5167,
        'longitude': 73.8414,
        'address': 'Near Deccan Gymkhana, Pune',
        'priority': 'medium',
        'status': 'resolved',
    },
    {
        'title': 'Construction site noise at midnight in Baner',
        'description': 'A construction site in Baner is operating heavy machinery late at night, well past 10 PM. The noise is disturbing hundreds of families in the surrounding residential area. This is a clear violation of noise regulation norms.',
        'category': 'noise',
        'latitude': 18.5590,
        'longitude': 73.7868,
        'address': 'Baner Road, Baner, Pune',
        'priority': 'low',
        'status': 'pending',
    },
    {
        'title': 'Broken swings in Nehru Park playground',
        'description': 'Two of the three swings in the children playground at Nehru Park are broken and dangerous. A child was injured last week. The seats are rusted and chains are weak. Please repair or replace them.',
        'category': 'parks',
        'latitude': 18.5245,
        'longitude': 73.8489,
        'address': 'Nehru Park, Camp Area, Pune',
        'priority': 'medium',
        'status': 'pending',
    },
    {
        'title': 'Damaged road divider on Pune-Mumbai Highway',
        'description': 'The road divider on the Pune-Mumbai Highway near Wakad exit has been severely damaged after an accident. Broken concrete pieces are lying on the road. This is extremely dangerous for vehicles.',
        'category': 'road',
        'latitude': 18.5950,
        'longitude': 73.7630,
        'address': 'Pune-Mumbai Highway, near Wakad Exit',
        'priority': 'critical',
        'status': 'pending',
    },
    {
        'title': 'Waste dumping near school in Hadapsar',
        'description': 'People are dumping household and construction waste on the vacant plot right next to St. Mary School in Hadapsar. Children are exposed to pollution and health hazards. This needs to be cleaned up and the area should be fenced.',
        'category': 'garbage',
        'latitude': 18.5089,
        'longitude': 73.9260,
        'address': 'Near St. Mary School, Hadapsar, Pune',
        'priority': 'high',
        'status': 'pending',
    },
    {
        'title': 'Exposed electric wires near children park',
        'description': 'Electric wires from a broken pole are hanging low near the children park entrance in Viman Nagar. This is an extreme safety hazard that could cause electrocution. Emergency repair needed immediately.',
        'category': 'electricity',
        'latitude': 18.5679,
        'longitude': 73.9143,
        'address': 'Viman Nagar, near Children Park, Pune',
        'priority': 'critical',
        'status': 'in_progress',
    },
    {
        'title': 'Stagnant water breeding mosquitoes in Katraj',
        'description': 'There is a large pool of stagnant water in the empty plot behind Katraj Chowk that has become a breeding ground for mosquitoes. Several people in the area have fallen ill with dengue. This needs urgent drainage.',
        'category': 'sanitation',
        'latitude': 18.4575,
        'longitude': 73.8637,
        'address': 'Behind Katraj Chowk, Katraj, Pune',
        'priority': 'high',
        'status': 'pending',
    },
    {
        'title': 'No parking sign missing at Koregaon Park',
        'description': 'The no-parking signs on Lane 5 of Koregaon Park have been removed. Vehicles are now parking on both sides making the narrow lane impassable. Emergency vehicles cannot pass through.',
        'category': 'traffic',
        'latitude': 18.5362,
        'longitude': 73.8931,
        'address': 'Lane 5, Koregaon Park, Pune',
        'priority': 'low',
        'status': 'resolved',
    },
]

SAMPLE_COMMENTS = [
    "I've seen the same issue and it's getting worse every day.",
    "This has been pending for weeks now. When will it be fixed?",
    "I can confirm this problem. My family is also affected.",
    "Authorities please take note. This is a serious issue.",
    "Thank you for reporting this. I was about to report the same thing.",
    "The situation has worsened since last week. Urgent action needed.",
    "I've reported this issue multiple times but no action has been taken.",
    "This is a daily problem for commuters. Please resolve it.",
]


class Command(BaseCommand):
    help = 'Seed database with demo users and sample issues'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # Create demo users
        superadmin, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'superadmin@civicai.com',
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': 'super_admin',
                'is_staff': True,
                'is_superuser': True,
                'phone': '9876543210',
                'area': 'All Areas',
            }
        )
        if created:
            superadmin.set_password('admin123')
            superadmin.save()
            self.stdout.write(self.style.SUCCESS('Created superadmin user'))

        areaadmin, created = User.objects.get_or_create(
            username='areaadmin',
            defaults={
                'email': 'areaadmin@civicai.com',
                'first_name': 'Area',
                'last_name': 'Admin',
                'role': 'area_admin',
                'phone': '9876543211',
                'area': 'Pune Central',
            }
        )
        if created:
            areaadmin.set_password('admin123')
            areaadmin.save()
            self.stdout.write(self.style.SUCCESS('Created areaadmin user'))

        areaadmin2, created = User.objects.get_or_create(
            username='areaadmin2',
            defaults={
                'email': 'areaadmin2@civicai.com',
                'first_name': 'Priya',
                'last_name': 'Sharma',
                'role': 'area_admin',
                'phone': '9876543212',
                'area': 'Pune West',
            }
        )
        if created:
            areaadmin2.set_password('admin123')
            areaadmin2.save()
            self.stdout.write(self.style.SUCCESS('Created areaadmin2 user'))

        demouser, created = User.objects.get_or_create(
            username='demouser',
            defaults={
                'email': 'user@civicai.com',
                'first_name': 'Demo',
                'last_name': 'User',
                'role': 'user',
                'phone': '9876543213',
                'area': 'Pune Central',
            }
        )
        if created:
            demouser.set_password('user123')
            demouser.save()
            self.stdout.write(self.style.SUCCESS('Created demouser'))

        # Create additional demo users
        demo_users = []
        user_names = [
            ('Rahul', 'Verma'), ('Sneha', 'Patil'), ('Amit', 'Kumar'),
            ('Priya', 'Singh'), ('Rohan', 'Deshmukh')
        ]
        for i, (first, last) in enumerate(user_names):
            user, created = User.objects.get_or_create(
                username=f'{first.lower()}{last.lower()}',
                defaults={
                    'email': f'{first.lower()}@civicai.com',
                    'first_name': first,
                    'last_name': last,
                    'role': 'user',
                    'phone': f'987654{3220+i}',
                    'area': random.choice(['Pune Central', 'Pune West', 'Pune East']),
                }
            )
            if created:
                user.set_password('user123')
                user.save()
            demo_users.append(user)

        all_users = [demouser] + demo_users

        # Create sample issues
        if Issue.objects.count() == 0:
            admins = [areaadmin, areaadmin2]
            for i, issue_data in enumerate(SAMPLE_ISSUES):
                days_ago = random.randint(1, 30)
                issue = Issue.objects.create(
                    title=issue_data['title'],
                    description=issue_data['description'],
                    category=issue_data['category'],
                    ai_category=issue_data['category'],
                    status=issue_data['status'],
                    priority=issue_data['priority'],
                    priority_score=random.uniform(0.1, 0.9),
                    reporter=random.choice(all_users),
                    assigned_to=random.choice(admins) if issue_data['status'] in ['in_progress', 'resolved'] else None,
                    latitude=issue_data['latitude'],
                    longitude=issue_data['longitude'],
                    address=issue_data['address'],
                    upvote_count=random.randint(0, 25),
                )
                issue.created_at = timezone.now() - timedelta(days=days_ago)
                issue.save(update_fields=['created_at'])

                if issue.status == 'resolved':
                    issue.resolved_at = timezone.now() - timedelta(days=max(0, days_ago - 5))
                    issue.resolution_notes = 'Issue has been resolved by the maintenance team. Thank you for reporting.'
                    issue.save()

                # Add random comments
                num_comments = random.randint(0, 3)
                for _ in range(num_comments):
                    Comment.objects.create(
                        issue=issue,
                        user=random.choice(all_users),
                        text=random.choice(SAMPLE_COMMENTS)
                    )

                # Add random votes
                num_votes = random.randint(0, 5)
                voters = random.sample(all_users, min(num_votes, len(all_users)))
                for voter in voters:
                    Vote.objects.get_or_create(issue=issue, user=voter)

            self.stdout.write(self.style.SUCCESS(f'Created {len(SAMPLE_ISSUES)} sample issues'))

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write('')
        self.stdout.write('Demo credentials:')
        self.stdout.write(f'  Super Admin  - username: superadmin  | password: admin123')
        self.stdout.write(f'  Area Admin   - username: areaadmin   | password: admin123')
        self.stdout.write(f'  User         - username: demouser    | password: user123')
