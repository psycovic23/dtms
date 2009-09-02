# Create your views here.

from django.http import HttpResponse
from django.conf import settings
from models import *
from django.shortcuts import render_to_response
from django.utils import simplejson as json
import operator, decimal
import pdb



def list(request):
    items = Item.objects.all()
    return render_to_response('list.html', {"items": items })

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
        if len(t.user_set.all()) !=0:
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
            t = Tag.objects.get(name=x['tags'])
        except:
            t = Tag(name=x['tags'])
            t.save()

        # if edit_id exists, then find the item, else create another

        if 'edit_id' in x:
            ref_item            = Item.objects.get(id=x['edit_id'])

            # get rid of existing links and just remake them below
            ref_item.delete_m2m_links()

            ref_item.tag        = t
            ref_item.sub_tag    = x['sub_tag']

            ref_item.name       = x['name']
            ref_item.purch_date = p_d
            ref_item.price      = x['price']
            ref_item.comments   = x['comments']

            ref_item.save()

        else:
            ref_item = Item(
                name            = x['name'], 
                purch_date      = p_d,
                price           = x['price'], 
                comments        = x['comments'], 
                house_id        = x['house_id'], 
                archive_id      = 0, 
                tag             = t, 
                sub_tag         = x['sub_tag']
            )

            pdb.set_trace()

            ref_item.save()

        if 'expanded' not in x:
            # get list of all users involved w/ item
            total_users = map(lambda a,b: a or b, x['users_yes'], x['users_maybe'])
            total_users = [s for s in total_users if s != 0]
    
            b = User.objects.get(id=x['buyer'])
            buyer_link = Buyer_item_rel(
                buyer           = b,
                item            = ref_item,
                payment_amount  = ref_item.price
            )
            buyer_link.save()


            # for each user, create a link and whether they're buying or not 
            for u in total_users:
                person = User.objects.get(id=u)
    
                #maybe.count(u) should always be 0 or 1
                link = User_item_rel(
                    user            = person, 
                    item            = ref_item, 
                    maybe_buying    = x['users_maybe'].count(u),
                    payment_amount  = decimal.Decimal(ref_item.price) /
                                        decimal.Decimal(len(total_users))
                )
    
                link.save()
        else:
            for t in x['expanded_buyers']:
                if decimal.Decimal(t[1]) != 0:
                    b_link = Buyer_item_rel(
                        buyer           = User.objects.get(id=t[0]),
                        item            = ref_item,
                        payment_amount  = t[1]
                    )
                    b_link.save()

            for t in x['expanded_users']:
                if decimal.Decimal(t[1]) != 0:
                    u_link = User_item_rel(
                        user            = User.objects.get(id=t[0]),
                        item            = ref_item,
                        maybe_buying    = 0,
                        payment_amount  = t[1]
                    )
                    u_link.save()

        return HttpResponse('success')

# sends item info to the add item page in order to fill it in
def edit_item(request):
    if request.POST:
        i = Item.objects.get(id=request.POST.get('item_id'))
        users = i.user_item_rel_set.all()
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
