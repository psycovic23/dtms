# Create your views here.
from django.http import HttpResponse

def process_sms(request, sms_string):
    return HttpResponse(sms_string)

