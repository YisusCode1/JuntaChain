from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.db.models import Max
from .models import Junta


# ===========================
# Página de inicio
# ===========================
def index(request):
    return render(request, 'dinero_app/index.html')


# ===========================
# Crear una nueva junta
# ===========================
def crear_junta(request):
    if request.method == 'POST':
        try:
            numero_participantes = int(request.POST.get('numero_participantes'))
            cantidad_aporte = float(request.POST.get('cantidad_aporte'))
            direccion_organizador = request.POST.get('direccion_organizador')
            contract_address = request.POST.get('contract_address')  # ✅ viene del front o Factory

            # Obtener el último código existente
            ultimo_codigo = Junta.objects.aggregate(Max('codigo'))['codigo__max']
            try:
                nuevo_numero = int(ultimo_codigo) + 1 if ultimo_codigo else 1
            except (TypeError, ValueError):
                nuevo_numero = 1

            nuevo_codigo = str(nuevo_numero).zfill(6)

            # Crear la junta
            nueva_junta = Junta.objects.create(
                numero_participantes=numero_participantes,
                cantidad_aporte=cantidad_aporte,
                direccion_organizador=direccion_organizador,
                codigo=nuevo_codigo,
                contract_address=contract_address  # ✅ guardamos el contrato asociado
            )

            # ✅ Si viene de AJAX (fetch)
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'codigo': nueva_junta.codigo,
                    'colateral': float(nueva_junta.colateral_total),
                    'redirect_url': f'/ver_junta/{nueva_junta.codigo}/'
                })

            # Si viene de formulario normal
            return redirect('ver_junta', codigo=nueva_junta.codigo)

        except Exception as e:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'error': str(e)})
            else:
                return render(request, 'dinero_app/crear_junta.html', {'error': str(e)})

    return render(request, 'dinero_app/crear_junta.html')


# ===========================
# Ver una junta (organizador o participante)
# ===========================
def ver_junta(request, codigo):
    junta = get_object_or_404(Junta, codigo=codigo)

    # Preparamos datos limpios para el template
    junta_data = {
        'codigo': junta.codigo,
        'numero_participantes': junta.numero_participantes,
        'cantidad_aporte': float(junta.cantidad_aporte),
        'direccion_organizador': junta.direccion_organizador,
        'contract_address': junta.contract_address or "",
        'fecha_creacion': junta.fecha_creacion.strftime("%Y-%m-%d %H:%M"),
    }

    # ⚠️ Se pasa como 'junta' (no 'juntaData') para coincidir con tu HTML actual
    return render(request, 'dinero_app/ver_junta.html', {'junta': junta_data})


# ===========================
# Página para unirse a una junta
# ===========================
def unirse_junta(request):
    return render(request, 'dinero_app/unirse.html')


# ===========================
# Buscar junta por código
# ===========================
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


