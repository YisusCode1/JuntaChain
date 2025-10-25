from django.shortcuts import render, redirect
from .models import Junta

# Página de inicio
def index(request):
    juntas = Junta.objects.all().order_by('-id')  # 👈 muestra las juntas más recientes
    return render(request, 'dinero_app/index.html', {'juntas': juntas})

# Página para crear una junta
def crear_junta(request):
    if request.method == 'POST':
        numero_participantes = request.POST.get('numero_participantes')
        cantidad_aporte = request.POST.get('cantidad_aporte')
        direccion_organizador = request.POST.get('direccion_organizador')

        Junta.objects.create(
            numero_participantes=numero_participantes,
            cantidad_aporte=cantidad_aporte,
            direccion_organizador=direccion_organizador
        )

        return redirect('dinero_app:index')  # redirige al inicio tras crear la junta

    return render(request, 'dinero_app/crear_junta.html')

