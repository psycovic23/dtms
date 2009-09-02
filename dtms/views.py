# Create your views here.

from django.http import HttpResponse
from django.conf import settings
from models import *
from django.shortcuts import render_to_response
from django.utils import simplejson as json
import operator
import pdb



def list(request):
    items = Item.objects.all()
    return render_to_response('list.html', {"items": items, "tag_price":
                                            tag_price()})

def adduser(request):
    if not request.POST:
        return render_to_response('adduser.html', {'success': False})
    else:
        u = User(name=request.POST['name'], email=request.POST['email'], house_id=request.POST['house_id'], password=request.POST['password'])
        u.save()
        return HttpResponse('success')

def tag_price():
    x = Tag.objects.all()
    temp = []
    for t in x:
        if len(t.item_set.all()) !=0:
            temp.append(t.cat_price())
    return temp


def index(request):
    items = Item.objects.all()
    return render_to_response('index.html', {"names": User.objects.all(),
                                             "house_id":
                                             request.session['house_id'],
                                             "items": items})

# fix the bad naming of variables
def add_item(request):
    if request.POST:
        x = json.loads(request.POST['string'])


        # create datetime object
        p_d = datetime.date(
            int(x['purch_date'][0]), 
            int(x['purch_date'][1]), 
            int(x['purch_date'][2])
        )


        # add edit tags
        try:
            t = Tag.objects.get(tag_name=x['tags'])
        except:
            t = Tag(tag_name=x['tags'])
            t.save()

        # if edit_id exists, then find the item, else create another

        if 'edit_id' in x:
            ref_item            = Item.objects.get(id=x['edit_id'])
            ref_item.tag        = t
            ref_item.sub_tag    = x['sub_tag']

            ref_item.name       = x['name']
            ref_item.purch_date = p_d
            ref_item.price      = x['price']
            ref_item.buyer      = x['buyer']
            ref_item.comments   = x['comments']

            ref_item.save()

        else:
            ref_item = Item(
                name            = x['name'], 
                purch_date      = p_d,
                price           = x['price'], 
                buyer           = x['buyer'],
                comments        = x['comments'], 
                house_id        = x['house_id'], 
                archive_id      = 0, 
                tag             = t, 
                sub_tag         = x['sub_tag']
            )

            ref_item.save()

        # get list of all users involved w/ item
        total_users = map(lambda a,b: a or b, x['users_yes'], x['users_maybe'])
        total_users = [s for s in total_users if s != 0]

        # for each user, create a link and whether they're buying or not 
        for u in total_users:
            person = User.objects.get(id=u)

            #maybe.count(u) should always be 0 or 1
            link = Item_status(
                user = person, 
                item = ref_item, 
                maybe_buying = x['users_maybe'].count(u)
            )

            link.save()

        return HttpResponse('success')

# sends item info to the add item page in order to fill it in
def edit_item(request):
    if request.POST:
        i = Item.objects.get(id=request.POST.get('item_id'))
        users = i.item_status_set.all()
        users_string = {}
        for x in users:
            users_string[x.user.id] = x.maybe_buying
        info = {
            'name': i.name, 
            'price': str(i.price), 
            'purch_date': i.purch_date.isoformat().replace('-','/'), 
            'tags': str(i.tag_name()), 
            'comments': i.comments, 
            'users': users_string, 'sub_tag': str(i.sub_tag_name())
        }

        return HttpResponse(json.dumps(info))

def delete_item(request):
    if request.POST:
        i = Item.objects.get(id=request.POST.get('delete_id'))
        i.delete()
        return HttpResponse(json.dumps({'delete_message': 'deleted'}))

def login(request):
    # add in recovery from failed attempt
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
    x = Item_list(list=Item.objects.all().filter(archive_id=0),
                  house_id=request.session['house_id'])
    return HttpResponse(x.gen_balancing_transactions())
