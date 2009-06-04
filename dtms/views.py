# Create your views here.

from django.http import HttpResponse
from django.conf import settings
from models import *
from django.shortcuts import render_to_response
from django.utils import simplejson as json


def list(request):
	return render_to_response('list.html', {"items":Item.objects.all()})



def adduser(request):
	if not request.POST:
		return render_to_response('adduser.html', {'success': False})
	else:
		u = User(name=request.POST['name'], email=request.POST['email'], house_id=request.POST['house_id'], password=request.POST['password'])
		u.save()
		return HttpResponse('success')


def index(request):
	return render_to_response('index.html', {"names": User.objects.all(), "house_id": request.session['house_id']})



# fix the bad naming of variables
def add_item(request):
	if request.POST:
		x = json.loads(request.POST['string'])
		# should i record when things were edited? and where?

		# if there's an edit_id, then edit the record
		if 'edit_id' in x:
			p_d = datetime.date(int(x['purch_date'][0]), int(x['purch_date'][1]), int(x['purch_date'][2]))
			i = Item.objects.get(id=x['edit_id'])
			i.name = x['name']
			i.purch_date = p_d
			i.price = x['price']
			i.users_yes = ",".join(map(str,[el for el in x['users_yes'] if el != None]))
			i.users_maybe = ",".join(map(str,[el for el in x['users_maybe'] if el != None]))
			i.comments = x['comments']
			i.tags = x['tags']
			i.save()
			return HttpResponse('edited item')
		else:
			# add item to db

			p_d = datetime.date(int(x['purch_date'][0]), int(x['purch_date'][1]), int(x['purch_date'][2]))

			# get list of all users involved w/ item
			total_users = map(lambda a,b: a or b, x['users_yes'], x['users_maybe'])
			total_users = [s for s in total_users if s != 0]

			i = Item(name=x['name'], purch_date=p_d, price=x['price'],buyer=x['buyer'], comments=x['comments'], tags=x['tags'], house_id=x['house_id'], archive_id=x['archive_id'])
			i.save()

			# for each user, create a link and whether they're buying or not 
			for u in total_users:
				person = User.objects.get(id=u)

				#maybe.count(u) should always be 0 or 1
				link = Item_status(user=person, item=i, maybe_buying=x['users_maybe'].count(u))
				link.save()


			return HttpResponse('success')

# sends item info to the add item page in order to fill it in
def edit_item(request):
	if request.POST:
		i = Item.objects.get(id=request.POST.get('item_id'))
		
		info = {'name': i.name, 'price': str(i.price), 'users_yes': i.users_yes, 'users_maybe': i.users_maybe, 'purch_date': i.purch_date.isoformat().replace('-','/'), 'tags': i.tags, 'comments': i.comments} 

		return HttpResponse(json.dumps(info))


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
