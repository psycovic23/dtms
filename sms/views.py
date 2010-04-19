# Create your views here.
from django.http import HttpResponse

from dtms.models import User

def process_sms(request, sms_string):
    words = sms_string.split('+')

    
    return HttpResponse(sms_string)

