from django.db import models

# Create your models here.

class Junta(models.Model):
    organizador = models.CharField(max_length=42)
    num_participantes = models.PositiveIntegerField()
    aporte = models.DecimalField(max_digits=10, decimal_places=2)
    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Junta {self.id} - {self.organizador}"