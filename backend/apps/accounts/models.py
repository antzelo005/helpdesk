from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models


class UserManager(DjangoUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Roles.CLIENT)
        return super().create_user(username, email=email, password=password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields["role"] = User.Roles.ADMIN
        extra_fields["is_staff"] = True
        extra_fields["is_superuser"] = True
        return super().create_superuser(username, email=email, password=password, **extra_fields)


class User(AbstractUser):
    class Roles(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        AGENT = "AGENT", "Agent"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.CLIENT)
    objects = UserManager()

    def save(self, *args, **kwargs):
        self.is_staff = self.role in {self.Roles.AGENT, self.Roles.ADMIN}
        self.is_superuser = self.role == self.Roles.ADMIN
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.username} ({self.role})"
