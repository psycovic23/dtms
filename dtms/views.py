# Create your views here.

from django.http import HttpResponse
from django.conf import settings
from models import *
from django.shortcuts import render_to_response
from django.utils import simplejson as json
import operator
import pdb


def list(request):
	return render_to_response('list.html', {"items":Item_model.objects.all()})



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

		# if there's an edit_id attribute, then edit the record
        if 'edit_id' in x:
            p_d = datetime.date(int(x['purch_date'][0]), int(x['purch_date'][1]), int(x['purch_date'][2]))
            i = Item_model.objects.get(id=x['edit_id'])
            i.users.clear()
            i.name = x['name']
            i.purch_date = p_d
            i.price = x['price']
            i.comments = x['comments']
            i.tags = x['tags']
            i.save()

    # adding many-to-many db entry
			# get list of all users involved w/ item
            total_users = map(lambda a,b: a or b, x['users_yes'], x['users_maybe'])
            total_users = [s for s in total_users if s != 0]

			# for each user, create a link and whether they're buying or not 
            for u in total_users:
                person = User.objects.get(id=u)

				#maybe.count(u) should always be 0 or 1
                link = Item_status(user=person, item=i, maybe_buying=x['users_maybe'].count(u))
                link.save()
               
            return HttpResponse('edited item')
        else:
			# add item to db

			p_d = datetime.date(int(x['purch_date'][0]), int(x['purch_date'][1]), int(x['purch_date'][2]))


			i = Item_model(name=x['name'], purch_date=p_d, price=x['price'],buyer=x['buyer'], comments=x['comments'], tags=x['tags'], house_id=x['house_id'], archive_id=x['archive_id'])
			i.save()



    # adding many-to-many db entry
			# get list of all users involved w/ item
			total_users = map(lambda a,b: a or b, x['users_yes'], x['users_maybe'])
			total_users = [s for s in total_users if s != 0]

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
		i = Item_model.objects.get(id=request.POST.get('item_id'))
        users = i.item_status_set.all()
        users_string = {}
        for x in users:
            users_string[x.user.id] = x.maybe_buying
        info = {'name': i.name, 'price': str(i.price), 'purch_date':
                i.purch_date.isoformat().replace('-','/'), 'tags': i.tags,
                'comments': i.comments, 'users': users_string} 
        return HttpResponse(json.dumps(info))


def login(request):
	if not request.POST:
		return render_to_response('login.html')
	else:
		m = User.objects.get(name=request.POST.get('user_name'))		
		if m.password == request.POST['password']:
			request.session['house_id'] = m.house_id
			return HttpResponse('yes')
		else:
			return HttpResponse('no')


def individual_bill(request):
	users = User.objects.filter(house_id=request.session['house_id'])
	sum = {}
	for a in users:
		sum[a.id] = 0

	for e in users:
		# item_stat is the intermediate object, so it's a list of Item_status 
		item_stat = e.item_status_set.all()

		# get all items that match the archive_id through the intermediate object
		# change archive_id to request.post object
		it = [ s.item for s in item_stat if s.item.archive_id==0 ]

		# now 'it' is a list of items the user is using that match the archive_id
		for i in it:
			num_users_per_item = len(i.users.all())
			sum[e.id] += i.price / num_users_per_item * -1
	
	# who-owes-what array
	for e in users:
		bought_items = Item_model.objects.filter(buyer=e.id)
		for b in bought_items:
			sum[e.id] += b.price
	# transactions
	transactions = [] 
	for (k,v) in sum.items():
		sum[k] = float(v)

	# while array is non zero
	while abs(max(sum.iteritems(), key=operator.itemgetter(1))[1]) > .01:

		owes = min(sum.iteritems(), key=operator.itemgetter(1))
		expects = max(sum.iteritems(), key=operator.itemgetter(1))
        

		if (owes[1] + expects[1]) < 0:
			amount = expects[1]
		else:
			amount = owes[1] * -1

		transactions.append([owes[0], expects[0], amount])
		sum[expects[0]] -= amount
		sum[owes[0]] += amount

	return HttpResponse('done')	


