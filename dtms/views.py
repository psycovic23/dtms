# Create your views here.

from django.template.loader import get_template
from django.http import HttpResponse
from django.conf import settings
from models import *
from django.shortcuts import render_to_response
from django.utils import simplejson as json

def adduser(request):
	if not request.POST:
		return render_to_response('adduser.html', {'success': False})
	else:
		u = User(name=request.POST['name'], email=request.POST['email'], house_id=request.POST['house_id'], password=request.POST['password'])
		u.save()
		return HttpResponse('success')


def index(request):
	if not request.POST:
		return render_to_response('index.html', {"names": User.objects.all()})
	else:
		x = json.loads(request.POST['string'])
		#[convertStr(el) for el in purch_date]
		p_d = datetime.date(int(x['purch_date'][2]), int(x['purch_date'][0]), int(x['purch_date'][1]))
		i = Item(name=x['name'], purch_date=p_d, price=x['price'],buyer=x['buyer'], users_yes=", ".join(map(str,[el for el in x['users_yes'] if el != None])),users_maybe=", ".join(map(str,[el for el in x['users_maybe'] if el != None])), comments=x['comments'], tags=x['tags'], house_id=x['house_id'], session_id=x['session_id'])
		i.save()
		return HttpResponse('success')

