from django.db import models

def generar_codigo_incremental():
    """Genera un código incremental de 6 dígitos, empezando desde 000001"""
    ultimo = Junta.objects.order_by('-id').first()
    if not ultimo:
        nuevo_numero = 1
    else:
        # Tomamos el último ID y sumamos 1
        nuevo_numero = ultimo.id + 1
    return str(nuevo_numero).zfill(6)


class Junta(models.Model):
    codigo = models.CharField(max_length=6, unique=True, editable=False)
    numero_participantes = models.IntegerField()
    cantidad_aporte = models.DecimalField(max_digits=10, decimal_places=2)
    direccion_organizador = models.CharField(max_length=100)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    empezada = models.BooleanField(default=False)

    class Meta:
        ordering = ["-fecha_creacion"]

    def __str__(self):
        return f"Junta #{self.codigo} - Organizador: {self.direccion_organizador}"

    def save(self, *args, **kwargs):
        if not self.codigo:
            self.codigo = generar_codigo_incremental()
        super().save(*args, **kwargs)

    @property
    def colateral_total(self):
        return self.numero_participantes * self.cantidad_aporte

    def participantes_activos(self):
        return self.participante_set.all()

    def numero_participantes_validos(self):
        return self.participante_set.count()

    def all_colateral_paid(self):
        participants = self.participante_set.all()
        if participants.count() < self.numero_participantes:
            return False
        return all(p.pago_colateral for p in participants)


class Participante(models.Model):
    junta = models.ForeignKey(Junta, on_delete=models.CASCADE)
    direccion = models.CharField(max_length=100)
    fecha_registro = models.DateTimeField(auto_now_add=True)
    pago_colateral = models.BooleanField(default=False)
    pago_mensual = models.BooleanField(default=False)
    monto_pagado = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        unique_together = ("junta", "direccion")

    def __str__(self):
        return f"{self.direccion} @ {self.junta.codigo}"
