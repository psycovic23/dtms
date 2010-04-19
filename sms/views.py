# Create your views here.
from django.http import HttpResponse

from dtms.models import User, Tag, newItem, Buyer_item, User_item

import datetime, decimal
from django.utils import simplejson as json

def process_sms(request, sms_string):
    words = sms_string.split('+')
    users = User.objects.filter(house_id=request.session['house_id'])
    names = [p.name for p in users]
    buyer = None
    user = None
    price = None
    item_description = None

    # found first name
    for i in range(len(words)):
        if words[i] in names:
            buyer = User.objects.get(name=words[i],
                                     house_id=request.session['house_id'])
            del words[i]
            break

    # found second name
    for i in range(len(words)):
        if words[i] in names:
            user = User.objects.get(name=words[i],
                                    house_id=request.session['house_id'])
            del words[i]
            break

    # get price
    for i in range(len(words)):
        try:
            price = float(words[i])
        except:
            pass

    # find everything after 'for'
    try:
        for_index = words.index('for')
        item_description = words[for_index+1:]
    except:
        pass

    # set current time as purch date
    today =  datetime.datetime.today()
    tag = Tag.objects.get(name='uncategorized',
                          house_id=request.session['house_id'])

    
    # generate the buyer and user price data
    buyer_array = {}
    buyer_array[buyer.id] = [price, buyer.name]

    user_array = {}
    user_array[user.id] = [price, user.name]

    print buyer_array
    print user_array

    # fix name
    if item_description:
        name = item_description
    else:
        name = 'phone entry'

    ref_item = newItem(
        name = name,
        price = decimal.Decimal(str(round(float(price), 2))),
        archive_id = 0,
        house_id = request.session['house_id'],
        tag = tag,
        comments = "",
        purch_date = today,
        users_a = json.dumps(user_array), 
        buyers_a = json.dumps(buyer_array)
    )

    ref_item.save()
    b_link = Buyer_item(user=buyer, item=ref_item)
    b_link.save()

    u_link = User_item(user=user, item=ref_item)
    u_link.save()


    print ref_item.id
    
    return HttpResponse(request.session['house_id'])

