# Create your views here.

from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.utils import simplejson as json
import operator, decimal
import pdb
from mysite.dtms.models import *
#from mysite.dtms.item_list import *


def list(request, a_num=0):
    items = Item.objects.filter(house_id=request.session['house_id']).filter(archive_id=a_num)
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


def addItem(request):
    return render_to_response('addItem.html', {"names":
                                               User.objects.filter(house_id=request.session['house_id']),
                                               "user_id":
                                               request.session['user_id']})
def showArchives(request):
    # retrieve archive_id groups and their ranges to display in the archive
    # section
    r = Item.objects.filter(house_id=request.session['house_id']).order_by('archive_id').reverse()
    if len(r) != 0:
        m = r[0].archive_id + 1
    else:
        m = 0

    
    arch = []
    for i in range(1, m):
        x = Item.objects.filter(archive_id=i).order_by('purch_date')
        arch.append([i, str(x[0].purch_date), str(x[len(x)-1].purch_date)])

    return render_to_response('showArchives.html', {"archive_list": arch})

def index(request):

    return render_to_response('index.html', {"names":
                                             User.objects.filter(house_id=request.session['house_id']),
                                             "house_id":
                                             request.session['house_id'],
                                             "user_id":
                                             request.session['user_id']},
                              context_instance = RequestContext(request))

def getTagList(request):
    tags = Tag.objects.filter(house_id=request.session['house_id'])
    return HttpResponse(json.dumps({'tags': [p.name for p in tags]}))

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
            t = Tag.objects.get(name=x['tags'],
                                house_id=request.session['house_id'])
        except:
            t = Tag(name=x['tags'], house_id=request.session['house_id'])
            t.save()

        # if edit_id exists, save the id and delete original record
        if 'edit_id' in x:
            ref_item            = Item.objects.get(id=x['edit_id'])
            
            # delete tag that has no items
            if (len(ref_item.tag.item_set.all()) == 1) and (ref_item.tag !=
                                                            t):
                ref_item.tag.delete()

            ref_item.delete()

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

        # assign old id number
        if 'edit_id' in x:
            ref_item.id = x['edit_id']
            
        ref_item.save()

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

def is_equal_values(list):
    t = []
    for (k,v) in list.items():
        t.append(v)
        
    for i in range(0, len(t)-1):
        if t[i] != t[i+1]:
            return False
    return True

# sends item info to the add item page in order to fill it in
def edit_item(request):
    if request.POST:
        i = Item.objects.get(id=request.POST.get('item_id'))
        users = i.user_item_rel_set.all()

        users_string = {}

        for x in User.objects.filter(house_id=request.session['house_id']):
            users_string[x.id] = 0
        
        for x in users:
            users_string[x.user.id] = float(x.payment_amount)

        info = {
            'name': i.name, 
            'price': str(i.price), 
            'purch_date': i.purch_date.isoformat().replace('-','/'), 
            'tags': str(i.tag_name()), 
            'comments': i.comments, 
            'users': users_string, 'sub_tag': str(i.sub_tag_name())
        }

        ind_pay = {}
        buyer_pay = {}
        #if (is_equal_values([p.payment_amount for p in
        #                    i.user_item_rel_set.all()]) == False) or ( len(i.buyer_item_rel_set.all()) != 1 ):
        for t in i.user_item_rel_set.all():
            ind_pay[t.user.id] = float(t.payment_amount)

        for t in i.buyer_item_rel_set.all():
            buyer_pay[t.buyer.id] = float(t.payment_amount)
        info['ind_pay'] = ind_pay
        info['buyer_pay'] = buyer_pay
        if (is_equal_values(buyer_pay) == True) and (is_equal_values(ind_pay) ==
                                                    True):
            info['equalArray'] = 1
        else:
            info['equalArray'] = 0


        return HttpResponse(json.dumps(info))

def clear_cycle(request):
    i = Item.objects.filter(house_id=request.session['house_id']).filter(archive_id=0)
    r = Item.objects.filter(house_id=request.session['house_id']).order_by('archive_id').reverse()
    m = r[0].archive_id + 1

    for t in i:
        t.archive_id=m
        t.save()

    return HttpResponse('success');

def delete_item(request):
    if request.POST:
        i = Item.objects.get(id=request.POST.get('delete_id'))

        # delete tag that has no items
        if len(i.tag.item_set.all()) == 1:
            i.tag.delete()
        i.delete()
        return HttpResponse(json.dumps({'delete_message': 'deleted'}))

def login(request):
    # add in recovery from failed attempt
    if not request.POST:
        return render_to_response('login.html', {}, 
                              context_instance = RequestContext(request))
    else:
        m = User.objects.get(name=request.POST.get('username'))        
        if m.password == request.POST['password']:
            request.session['house_id'] = m.house_id
            request.session['user_id'] = m.id
            return HttpResponse('yes')
        else:
            return HttpResponse('no')

def tag_breakdown(request, id):
    x = Item_list(list=Item.objects.filter(archive_id=0),
                  house_id=request.session['house_id'])
    return HttpResponse(x.ind_breakdown(uid=id))


def individual_bill(request):
    x = Item_list(list=Item.objects.filter(archive_id=0),
                  house_id=request.session['house_id'])
    return HttpResponse({'tag_breakdown': x.gen_balancing_transactions})
