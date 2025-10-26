from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.db.models import Max
from .models import Junta


# Página de inicio
def index(request):
    return render(request, 'dinero_app/index.html')


# Crear una nueva junta
def crear_junta(request):
    if request.method == 'POST':
        try:
            numero_participantes = int(request.POST.get('numero_participantes'))
            cantidad_aporte = float(request.POST.get('cantidad_aporte'))
            direccion_organizador = request.POST.get('direccion_organizador')

            # Obtener el último código existente (solo los que son numéricos)
            ultimo_codigo = Junta.objects.aggregate(Max('codigo'))['codigo__max']
            try:
                nuevo_numero = int(ultimo_codigo) + 1 if ultimo_codigo else 1
            except (TypeError, ValueError):
                nuevo_numero = 1

            nuevo_codigo = str(nuevo_numero).zfill(6)

            # Crear la junta con el código ya asignado
            nueva_junta = Junta.objects.create(
                numero_participantes=numero_participantes,
                cantidad_aporte=cantidad_aporte,
                direccion_organizador=direccion_organizador,
                codigo=nuevo_codigo
            )

            # ✅ Si es una solicitud AJAX (fetch)
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'codigo': nueva_junta.codigo,
                    'colateral': float(nueva_junta.colateral_total),
                    'redirect_url': f'/ver_junta/{nueva_junta.codigo}/'
                })

            # Si es formulario normal
            return redirect('ver_junta', codigo=nueva_junta.codigo)

        except Exception as e:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': str(e)})
            else:
                return render(request, 'dinero_app/crear_junta.html', {'error': str(e)})

    return render(request, 'dinero_app/crear_junta.html')


# Ver una junta creada (organizador)
def ver_junta(request, codigo):
    junta = get_object_or_404(Junta, codigo=codigo)
    return render(request, 'dinero_app/ver_junta.html', {'junta': junta})


# Página para unirse a una junta
def unirse_junta(request):
    return render(request, 'dinero_app/unirse.html')


# Buscar junta por código
def buscar_junta(request):
    codigo = request.GET.get('codigo')
    if codigo:
        try:
            junta = Junta.objects.get(codigo=codigo)
            return redirect('ver_junta', codigo=junta.codigo)
        except Junta.DoesNotExist:
            return render(request, 'dinero_app/unirse.html', {
                'error': '⚠️ No existe ninguna junta con ese código.'
            })
    return render(request, 'dinero_app/unirse.html')
