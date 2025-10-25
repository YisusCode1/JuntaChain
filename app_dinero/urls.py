from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('crear_junta/', views.crear_junta, name='crear_junta'),
    path('ver_junta/<str:codigo>/', views.ver_junta, name='ver_junta'),  # ✅ IMPORTANTE
    path('unirse/', views.unirse_junta, name='unirse_junta'),
    path('buscar_junta/', views.buscar_junta, name='buscar_junta'),
]
