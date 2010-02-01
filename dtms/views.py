# Create your views here.

from django.http import HttpResponse
from django.conf import settings
from django.shortcuts import render_to_response
from django.template import RequestContext, Template, Context
from django.template.loader import get_template
from django.utils import simplejson as json
import operator, decimal, pdb
from operator import eq
from dtms.models import *
from re import sub

def shoppingList(request):
    lists = {}
    for l in SL.objects.filter(house_id=request.session['house_id']):
        items = l.sl_item_set.all()
        lists[l] = items

    return render_to_response('shoppingList.html', {'lists': lists})

def read(request):
    return render_to_response('read.html', {},
                              context_instance = RequestContext(request))
def addSLItem(request):
    newItem = SL_item(name=request.POST['name'], marked=0,
                      list=SL.objects.get(id=request.POST['listID']),
                                          added_by=User.objects.get(id=request.session['user_id']))
    newItem.save()
    return HttpResponse()

def deleteSL(request):
    l = SL.objects.get(id=request.POST['listID'])
    items = SL_item.objects.filter(list=l)
    items.delete()
    l.delete()
    return HttpResponse()

def editSLItem(request):
    item = SL_item.objects.get(id=request.POST['id'].replace('SLI', ''))
    item.name = request.POST['value']
    item.save()
    return HttpResponse(request.POST['value'])

def createList(request):
    newList = SL(name=request.POST['listName'],
                 house_id=request.session['house_id'])
    newList.save()
    return HttpResponse(json.dumps({'aoeu': 'new'}))

def item_list(request, a_num=0, houseMode=0):

    items = newItem.objects.select_related().filter(house_id=request.session['house_id']).filter(archive_id=a_num)

    # throw items into Item_list for all the methods in the class Item_list
    # workaround for the user/house bug where transactions were based on the
    # viewed list, as opposed to the entire house
    itemlist = Item_list(item_list=items,
                  house_id=request.session['house_id'],
                  user_id=request.session['user_id'], archive_id=a_num,
                         houseMode=houseMode)

    tags = set([p.tag for p in items])

    # generate strings to show what time period/archive category we're in
    arch = items.order_by('purch_date')
    if arch:
        if a_num == '0':
            category = ([arch[0].purch_date.strftime('%b %d, \'%y'), "current"])
        else:
            category = ([arch[0].purch_date.strftime('%b %d, \'%y'),
                         arch[len(arch)-1].purch_date.strftime('%b %d, \'%y')])
    else:
        category = [' ', 'no items!']

    t = get_template('list.html')
    empty = len(items)

    arch = showArchDates(request)

    house_name = User.objects.get(id=request.session['user_id']).house_name
    html = t.render(Context({"empty": empty, 
                             "uid": request.session['user_id'], 
                             "items": items,
                             "list": itemlist, 
                             "tags": tags, 
                             "category": category,
                             "houseMode": houseMode,
                             "house_name": house_name,
                             "archive_list": arch,
                             "archive_id": a_num}))

    return HttpResponse(html)

def showArchDates(request):
    # retrieve archive_id groups and their ranges to display in the archive
    # section
    r = newItem.objects.filter(house_id=request.session['house_id']).order_by('archive_id').reverse()
    if r.count() != 0:
        m = r[0].archive_id + 1
    else:
        m = 0

    arch = []

    for i in range(1, m):
        x = newItem.objects.filter(house_id=request.session['house_id']).filter(archive_id=i).order_by('purch_date')
        arch.append([i, x[0].purch_date.strftime('%b %d, %y'),
                     x[len(x)-1].purch_date.strftime('%b %d, %y')])
    return arch

def graphData(request, a_num=0, houseMode=0):

    items = newItem.objects.select_related().filter(house_id=request.session['house_id']).filter(archive_id=a_num)
    itemlist = Item_list(item_list=items,
                  house_id=request.session['house_id'],
                  user_id=request.session['user_id'], archive_id=a_num,
                         houseMode=houseMode)
    if houseMode == "1":
        graphData = itemlist.barGraphData(1)
    else:
        graphData = itemlist.barGraphData()

    return HttpResponse(json.dumps(graphData))

def graphs(request):
    house_name = User.objects.get(id=request.session['user_id']).house_name
    arch = showArchDates(request)
    return render_to_response('graphs.html', {"house_name": house_name,
                                              "archive_list": arch})

def adduser(request):
    if not request.POST:
        return render_to_response('adduser.html', {'success': False},
                              context_instance = RequestContext(request))
    else:
        d = json.loads(request.POST['d'])
        if len(User.objects.filter(house_name=d['house_name'])) != 0:
            return HttpResponse('house name already exists. choose another')
        
        if len(set(d['users'])) != len(d['users']):
            return HttpResponse('same name in the list twice')
        
        if len(d['password']) == 0:
            return HttpResponse('put in a password!')
        

        nextHID = User.objects.order_by('-house_id')[0].house_id + 1

        for t in d['users']:
            u = User(name=t,
                     house_name=d['house_name'], 
                     house_id=nextHID, 
                     password=d['password'])
            u.save()

        return HttpResponse('success')

def addItemPage(request):
    t = get_template('addItem.html')
    html = t.render(Context({"names":
                             User.objects.filter(house_id=request.session['house_id']),
                             "user_id": request.session['user_id'],
                             "default_buyer": User.objects.get(id=request.session['user_id']).name }))
    tags = Tag.objects.filter(house_id=request.session['house_id'])
    return HttpResponse(json.dumps({'html': html, 'tags': [p.name for p in
                                                           tags]}))

def index(request):
    try:
        request.session['user_id']
    except:
        return login(request)
    else:
        return render_to_response('index.html', {"names":
                                             User.objects.filter(house_id=request.session['house_id']),
                                             "house_id":
                                             request.session['house_id'],
                                             "user_id":
                                             request.session['user_id']},
                              context_instance = RequestContext(request))

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
            tag = Tag.objects.get(name=x['tags'],
                                house_id=request.session['house_id'])
        except:
            tag = Tag(name=x['tags'], house_id=request.session['house_id'])
            tag.save()

        # if edit_id exists, save the id and delete original record
        if 'edit_id' in x:
            ref_item            = newItem.objects.get(id=x['edit_id'])
            
            # delete tag that has no items
            if (len(ref_item.tag.newitem_set.all()) == 1) and (ref_item.tag
                                                               !=tag):
                ref_item.tag.delete()

            ref_item.delete()

        buyer_temp = {}
        user_temp = {}

        for t in x['expanded_buyers']:
            if decimal.Decimal(t[1]) != 0:
                u_eb = User.objects.get(id=t[0])
                buyer_temp[u_eb.id] = [float(t[1]), u_eb.name]

        for t in x['expanded_users']:
            if decimal.Decimal(t[1]) != 0:
                u_eb = User.objects.get(id=t[0])
                user_temp[u_eb.id] = [float(t[1]), u_eb.name]

        ref_item = newItem(
            name = x['name'],
            price = decimal.Decimal(str(round(float(x['price']), 2))),
            archive_id = 0,
            house_id = request.session['house_id'],
            tag = tag,
            comments = x['comments'],
            purch_date = p_d,
            users_a = json.dumps(user_temp), 
            buyers_a = json.dumps(buyer_temp)
        )

        # assign old id number
        if 'edit_id' in x:
            ref_item.id = x['edit_id']
            
        ref_item.save()

        for t in x['expanded_buyers']:
            if decimal.Decimal(t[1]) != 0:
                b_link = Buyer_item(
                    user            = User.objects.get(id=t[0]),
                    item            = ref_item,
                )
                b_link.save()

        for t in x['expanded_users']:
            if decimal.Decimal(t[1]) != 0:
                u_link = User_item(
                    user            = User.objects.get(id=t[0]),
                    item            = ref_item,
                )
                u_link.save()

        # error checking
        if sum([p[0] for p in ref_item.users_o().values()]) != ref_item.price\
           or sum([p[0] for p in ref_item.buyers_o().values()]) != ref_item.price:
            raise Exception, "Item values don't add up"

        return HttpResponse('success')

# sends item info to the add item page in order to fill it in
def edit_item(request):
    if request.POST:
        i = newItem.objects.get(id=request.POST.get('item_id'))
        users = i.user_item_set.all()

        info = {
            'name': i.name, 
            'price': str(i.price), 
            'purch_date': i.purch_date.isoformat().replace('-','/'), 
            'tags': i.tag.name, 
            'comments': i.comments
        }

        ind_pay = {}
        buyer_pay = {}

        for (k,v) in i.users_o().items():
            ind_pay[k] = str(v[0])

        for (k,v) in i.buyers_o().items():
            buyer_pay[k] = str(v[0])

        info['ind_pay'] = ind_pay
        info['buyer_pay'] = buyer_pay

        return HttpResponse(json.dumps(info))

def clear_cycle(request):
    i = newItem.objects.filter(house_id=request.session['house_id']).filter(archive_id=0)
    r = newItem.objects.filter(house_id=request.session['house_id']).order_by('archive_id').reverse()
    m = r[0].archive_id + 1

    for t in i:
        t.archive_id=m
        t.save()

    return HttpResponse('success');

def delete_item(request):
    if request.POST:
        i = newItem.objects.get(id=request.POST.get('delete_id'))

        # delete tag that has no items
        if len(i.tag.newitem_set.all()) == 1:
            i.tag.delete()
        i.delete()
        return HttpResponse(json.dumps({'delete_message': 'deleted'}))

def login(request):
    # add in recovery from failed attempt
    if not request.POST:
        try:
            del request.session['house_id']
            del request.session['user_id']
        except:
            pass
        return render_to_response('login.html', {}, 
                              context_instance = RequestContext(request))
    else:
        try:
            m = User.objects.filter(house_name=request.POST.get('house_name')) \
                                    .get(name=request.POST.get('username'))        
        except:
            return HttpResponse('no')

        if m.password == request.POST['password']:
            request.session['house_id'] = m.house_id
            request.session['user_id'] = m.id
            return HttpResponse('yes')
        else:
            return HttpResponse('no')
