from django.shortcuts import render, redirect
from .models import Junta

def index(request):
    juntas = Junta.objects.all().order_by('-creada_en')
    return render(request, 'dinero_app/index.html', {'juntas': juntas})

def crear_junta(request):
    if request.method == 'POST':
        organizador = request.POST.get('organizador')
        num_participantes = request.POST.get('num_participantes')
        aporte = request.POST.get('aporte')

        Junta.objects.create(
            organizador=organizador,
            num_participantes=num_participantes,
            aporte=aporte
        )
        return redirect('dinero_app:index')

    return render(request, 'dinero_app/crear_junta.html')
