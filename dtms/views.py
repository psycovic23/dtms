# Create your views here.

from django.template.loader import get_template
from django.http import HttpResponse
from django.conf import settings
from models import *
from django.shortcuts import render_to_response
from django.utils import simplejson as json


def list(request):
	return render_to_response('list.html', {"items":Item.objects.all()})

def list_items(request):
	return render_to_response('list_items.html', {"names": User.objects.all(), "house_id": request.session['house_id']})


def adduser(request):
	if not request.POST:
		return render_to_response('adduser.html', {'success': False})
	else:
		u = User(name=request.POST['name'], email=request.POST['email'], house_id=request.POST['house_id'], password=request.POST['password'])
		u.save()
		return HttpResponse('success')


def index(request):
	if not request.POST:
		if request.session['edit'] == 0:
			return render_to_response('index.html', {"names": User.objects.all(), "house_id": request.session['house_id']})
		else:
			return render_to_response('index.html', {"names": User.objects.all(), "house_id": request.session['house_id']})
	else:
		x = json.loads(request.POST['string'])
		p_d = datetime.date(int(x['purch_date'][2]), int(x['purch_date'][0]), int(x['purch_date'][1]))
		i = Item(name=x['name'], purch_date=p_d, price=x['price'],buyer=x['buyer'], users_yes=", ".join(map(str,[el for el in x['users_yes'] if el != None])),users_maybe=", ".join(map(str,[el for el in x['users_maybe'] if el != None])), comments=x['comments'], tags=x['tags'], house_id=x['house_id'], session_id=x['session_id'])
		i.save()
		return HttpResponse('success')

def add_item(request):
	if request.POST:
		x = json.loads(request.POST['string'])
		p_d = datetime.date(int(x['purch_date'][2]), int(x['purch_date'][0]), int(x['purch_date'][1]))
		i = Item(name=x['name'], purch_date=p_d, price=x['price'],buyer=x['buyer'], users_yes=", ".join(map(str,[el for el in x['users_yes'] if el != None])),users_maybe=", ".join(map(str,[el for el in x['users_maybe'] if el != None])), comments=x['comments'], tags=x['tags'], house_id=x['house_id'], session_id=x['session_id'])
		i.save()
		return HttpResponse('success')



def login(request):
	if not request.POST:
		return render_to_response('login.html')
	else:
		m = User.objects.get(name=request.POST.get('user_name'))		
		if m.password == request.POST['password']:
			request.session['house_id'] = m.house_id
			request.session['edit'] = 0
			return HttpResponse('yes')
		else:
			return HttpResponse('no')


