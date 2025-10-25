from django.urls import path
from . import views

app_name = 'dinero_app'

urlpatterns = [
    path('', views.index, name='index'),
    path('crear_junta/', views.crear_junta, name='crear_junta'),
]