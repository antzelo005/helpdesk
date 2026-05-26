from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.tickets.models import TicketCategory


User = get_user_model()


class Command(BaseCommand):
    help = "Seed ticket categories and demo users."

    def handle(self, *args, **options):
        categories = [
            {
                "name": "Technical Support",
                "slug": "technical-support",
                "description": "Application issues, bugs, and outages.",
            },
            {
                "name": "Billing",
                "slug": "billing",
                "description": "Invoices, subscriptions, and payment queries.",
            },
            {
                "name": "Account Access",
                "slug": "account-access",
                "description": "Login, password reset, and account lockout issues.",
            },
        ]
        for category_data in categories:
            TicketCategory.objects.get_or_create(slug=category_data["slug"], defaults=category_data)

        demo_users = [
            {
                "username": "client_demo",
                "email": "client@example.com",
                "role": User.Roles.CLIENT,
                "password": "DemoPass123!",
            },
            {
                "username": "agent_demo",
                "email": "agent@example.com",
                "role": User.Roles.AGENT,
                "password": "DemoPass123!",
            },
            {
                "username": "admin_demo",
                "email": "admin@example.com",
                "role": User.Roles.ADMIN,
                "password": "DemoPass123!",
            },
        ]

        for user_data in demo_users:
            password = user_data.pop("password")
            user, created = User.objects.get_or_create(
                username=user_data["username"],
                defaults=user_data,
            )
            if created:
                user.set_password(password)
                user.save()
            else:
                updated = False
                for field, value in user_data.items():
                    if getattr(user, field) != value:
                        setattr(user, field, value)
                        updated = True
                if not user.check_password(password):
                    user.set_password(password)
                    updated = True
                if updated:
                    user.save()

        self.stdout.write(self.style.SUCCESS("Demo categories and users seeded successfully."))
