FoEproxy.addHandler('AchievementsService','getOverview', (data, postData) => {
    Profile.init(data.responseData)
});

FoEproxy.addFoeHelperHandler('ActiveMapUpdated', () => {
	if ($('#PlayerProfileButton').length !== 0) {
        $('#PlayerProfileButton span').attr('class',ActiveMap);
    }
});
FoEproxy.addFoeHelperHandler('BoostsUpdated', () => {
    Profile.update()
});

const Profile = {
    daysPlayed: 0,
    fpProduction: 0,
    fpBoost: 0,
    goods: {},
    guildGoods: 0,
    battleBoosts: {},
    settlements: [],
    achievements: null,
    favAchievements: [],

    init: (responseData) => {
        Profile.daysPlayed = responseData.achievementGroups.find(x => x.id == "special").achievements.find(x => x.id == 'foe_fanclub').currentLevel.progress || null
        Profile.showButton();
        Profile.settlements = responseData.achievementGroups.find(x => x.id == "cultural_settlements").achievements;
        Profile.achievements = responseData.achievementGroups;
        Profile.favAchievements = responseData.topAchievements;
    },

	showButton: () => {
		if ($('#PlayerProfileButton').length === 0) {
			HTML.AddCssFile('profile');
			let div = $('<div />');

			div.attr({
				id: 'PlayerProfileButton',
				class: 'game-cursor helper-blocker'
			});

			$('body').append(div).promise().done(function() {
				div.append('<span onclick="Profile.show()" class="'+ActiveMap+'"><img src="'+srcLinks.GetPortrait(ExtPlayerAvatar)+'" /></span>')
					.attr('title', i18n('Boxes.PlayerProfile.Tooltip'))
					.tooltip(
						{
							useFoEHelperSkin: true,
							headLine: i18n('Global.BoxTitle'),
							placement: 'bottom',
							html: true
						}
					);
			});
		}
	},

	show: () => {
		if ($('#PlayerProfile').length > 0) {
			HTML.CloseOpenBox('PlayerProfile')
			return
		}

		HTML.Box({
			id: 'PlayerProfile',
			title: ExtPlayerName,
			auto_close: true,
			dragdrop: true,
		})

		Profile.buildBody()
	},
    update: () => {
        if ($('#PlayerProfile').length > 0) Profile.buildBody(true);
    },
    buildBody: (isRebuild=false) => {
        let content = []
        let player = PlayerDict[ExtPlayerID];
        content.push('<div class="basicInfo pad">');
        content.push('<img src="'+srcLinks.GetPortrait(player.Avatar)+'" />');
        content.push('<div>');
        content.push('<h1>'+player.PlayerName+'</h1>');
        content.push('<span>'+i18n('Eras.'+CurrentEraID)+'</span><br>');
        content.push('<span class="ranking">'+HTML.Format(parseInt(player.Score))+'</span>');
        content.push('<span>⚔'+HTML.Format(parseInt(player.WonBattles))+'</span>');
        content.push('</div>');
        content.push('</div>');
        content.push('<div class="daysPlayed">');
        content.push(
            HTML.i18nReplacer(i18n('Boxes.PlayerProfile.DaysPlayed'), {
                number: HTML.Format(parseInt(Profile.daysPlayed)),
            }));
        content.push('</div>');
        content.push('</div>');

        // left content, city
        content.push('<div class="leftInfo showMore">');
        content.push('<div class="header flex">');
        content.push('<img src="'+srcLinks.get(`/city/buildings/H_SS_${CurrentEra}_Townhall.png`,true)+'" />')
        content.push('</div>');
        content.push('<div class="greatbuildings pad text-center">')
        let arcLevel = Object.values(MainParser.CityMapData).find(x => x.cityentity_id == "X_FutureEra_Landmark1")?.level;
        if (arcLevel)
            content.push('<span><img src="'+srcLinks.get(`/city/buildings/X_SS_FutureEra_Landmark1.png`,true)+'" />' + arcLevel +'</span>')
        let bgLevel = Object.values(MainParser.CityMapData).find(x => x.cityentity_id == "X_OceanicFuture_Landmark3")?.level;
        if (bgLevel)
            content.push('<span><img src="'+srcLinks.get(`/city/buildings/X_SS_OceanicFuture_Landmark3.png`,true)+'" />' + bgLevel +'</span>')
        let cfLevel = Object.values(MainParser.CityMapData).find(x => x.cityentity_id == "X_ProgressiveEra_Landmark2")?.level;
        if (cfLevel)
            content.push('<span><img src="'+srcLinks.get(`/city/buildings/X_SS_ProgressiveEra_Landmark2.png`,true)+'" />' + cfLevel +'</span>')
        let aoLevel = Object.values(MainParser.CityMapData).find(x => x.cityentity_id == "X_ArcticFuture_Landmark2")?.level;
        if (aoLevel)
            content.push('<span><img src="'+srcLinks.get(`/city/buildings/X_SS_ArcticFuture_Landmark2.png`,true)+'" />' + aoLevel +'</span>')
        content.push('</div>');
        
        content.push('<div class="text-center">');
        content.push('<img src="'+srcLinks.get(`/shared/gui/constructionmenu/icon_expansion.png`,true)+'" />')
        content.push(CityMap.UnlockedAreas.length*16+256-16); // unlocked areas + start area (- 16 somehow?)
        content.push('</div>');

        content.push('<div class="dailyProd pad">');
        content.push('<h2>'+i18n('Boxes.PlayerProfile.DailyProduction')+'</h2>');
        if (Profile.fpProduction == 0 || Profile.guildGoods == 0)
            content.push('<span class="important">'+i18n('Boxes.PlayerProfile.OpenProduction')+'</span><br>');
        content.push('<span class="fp">' + HTML.Format(parseInt(Profile.fpProduction)) + ", " + i18n('General.Boost')+ ' ' +Boosts.Sums.forge_points_production + '%</span><br>');
            content.push('<div class="goods">')
            if (Profile.goods[CurrentEraID-2])
                content.push('<span class="prev">' + HTML.Format(parseInt(parseInt(Profile.goods[CurrentEraID-2])) || 0) + '</span> ');
            if (Profile.goods[CurrentEraID-1])
                content.push('<span class="current">' + HTML.Format(parseInt(parseInt(Profile.goods[CurrentEraID-1])) || 0) + '</span> ');
            if (Profile.goods[CurrentEraID])
                content.push('<span class="next">' + HTML.Format(parseInt(parseInt(Profile.goods[CurrentEraID])) || 0) + '</span> ');
            if (Profile.guildGoods)
                content.push('<span class="guild">' + HTML.Format(parseInt(parseInt(Profile.guildGoods)) || 0) + '</span>')
            content.push('</div>');
        content.push('</div>');
        
        let hasQIBoosts = (Boosts.noSettlement.guild_raids_action_points_collection+Boosts.Sums.guild_raids_coins_production+Boosts.Sums.guild_raids_coins_start+Boosts.Sums.guild_raids_supplies_production+Boosts.Sums.guild_raids_supplies_start+Boosts.Sums.guild_raids_goods_start+Boosts.Sums.guild_raids_units_start !== 0)
        if (hasQIBoosts) {
            content.push('<div class="qiBoosts pad text-center">');
            content.push('<h2>'+i18n('Boxes.PlayerProfile.QIBoosts')+'</h2>');
            if (Boosts.Sums.guild_raids_coins_production + Boosts.Sums.guild_raids_coins_start !== 0) {
                content.push('<span class="qicoins">')
                if (Boosts.Sums.guild_raids_coins_production !== 0)
                    content.push(HTML.Format(parseInt(Boosts.Sums.guild_raids_coins_production)) + '% ');
                if (Boosts.Sums.guild_raids_coins_start !== 0)
                    content.push('+' + HTML.Format(parseInt(Boosts.Sums.guild_raids_coins_start)))
                content.push('</span> ');
            }
            if (Boosts.Sums.guild_raids_supplies_production + Boosts.Sums.guild_raids_supplies_start !== 0) {
                content.push('<span class="qisupplies">');
                if (Boosts.Sums.guild_raids_supplies_production !== 0)
                    content.push(HTML.Format(parseInt(Boosts.Sums.guild_raids_supplies_production)) + '% ');
                if (Boosts.Sums.guild_raids_supplies_start !== 0)
                    content.push('+' + HTML.Format(parseInt(Boosts.Sums.guild_raids_supplies_start)));
                content.push('</span> ');
            }
            if (Boosts.noSettlement.guild_raids_action_points_collection !== 0)
                content.push('<span class="qiactions">' + HTML.Format(parseInt(Boosts.noSettlement.guild_raids_action_points_collection)) + '</span> ');
            if (Boosts.Sums.guild_raids_goods_start !== 0)
                content.push('<span class="qigoods_start">+' + HTML.Format(parseInt(Boosts.Sums.guild_raids_goods_start)) + '</span> ');
            if (Boosts.Sums.guild_raids_units_start !== 0)
                content.push('<span class="qiunits_start">+' + HTML.Format(parseInt(Boosts.Sums.guild_raids_units_start)) + '</span> ');
            content.push('</div>');
        }
        content.push('</div>');

        // right content, stock
        content.push('<div class="rightInfo showMore">');
        content.push('<div class="header">');
        content.push('<img class="fp" src="'+srcLinks.get(`/shared/icons/quest_reward/icon_forgepoints.png`,true)+'" />')
        content.push('<img class="alabaster" src="'+srcLinks.get(`/shared/icons/goods_large/icon_fine_marble.png`,true)+'" />')
        content.push('<img src="'+srcLinks.get(`/shared/icons/reward_icons/reward_icon_boost_crate.png`,true)+'" />')
        content.push('<img class="goods" src="'+srcLinks.get(`/shared/icons/reward_icons/reward_icon_random_goods.png`,true)+'" />')
        content.push('</div>');
            content.push('<div class="stock pad text-center">');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/quest_reward/icon_forgepoints.png`,true)+'" /> '+HTML.Format(StrategyPoints.InventoryFP || 0)+'</span>');
            content.push('<span><img src="'+srcLinks.get(`/city/gui/great_building_bonus_icons/great_building_bonus_medals.png`,true)+'" /> '+HTML.FormatNumberShort(ResourceStock.medals || 0)+'</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/eventwindow_tavern.png`,true)+'" /> '+HTML.FormatNumberShort(ResourceStock.tavern_silver || 0)+'</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/gemstones.png`,true)+'" /> '+HTML.Format(ResourceStock.gemstones || 0)+'</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/gui/antiquedealer/antiquedealer_currency_trade_coins.png`,true)+'" /> '+HTML.FormatNumberShort(ResourceStock.trade_coins || 0)+'</span>');
            content.push('</div>');
            content.push('<div class="stock pad text-center">');
            let fspInventory = Object.values(MainParser.Inventory).find(x => x.itemAssetName == 'rush_single_event_building_instant')?.inStock;
            if (fspInventory)
                content.push('<span><img src="'+srcLinks.get(`/shared/icons/reward_icons/reward_icon_rush_single_event_building_instant.png`,true)+'" /> '+fspInventory+'</span>');
            let moInventory = Object.values(MainParser.Inventory).find(x => x.itemAssetName == 'motivate_one')?.inStock;
            if (moInventory)
                content.push('<span><img src="'+srcLinks.get(`/shared/icons/reward_icons/reward_icon_motivate_one.png`,true)+'" /> '+moInventory+'</span>');
            let rmsInventory = Object.values(MainParser.Inventory).find(x => x.itemAssetName == 'rush_mass_supply_large')?.inStock;
            if (rmsInventory)
                content.push('<span><img src="'+srcLinks.get(`/shared/icons/reward_icons/reward_icon_rush_mass_supply_large.png`,true)+'" /> '+rmsInventory+'</span>');
            // plus 1 einlagerung reno güter
            content.push('</div>');
        content.push('</div>');

        content.push('<div class="dailyProd hideOnMore pad">');
        content.push('<h2 class="text-center">'+i18n('Boxes.PlayerProfile.DailyProduction')+'</h2>');
        if (Profile.fpProduction == 0 || Profile.guildGoods == 0)
            content.push('<span class="important">'+i18n('Boxes.PlayerProfile.OpenProduction')+'</span><br>');
        content.push('<span class="fp">' + HTML.Format(parseInt(Profile.fpProduction)) + ", " + i18n('General.Boost')+ ' ' +Boosts.Sums.forge_points_production + '%</span><br>');
        content.push('<div class="goods">')
        if (Profile.goods[CurrentEraID-2])
            content.push('<span class="prev">' + HTML.Format(parseInt(parseInt(Profile.goods[CurrentEraID-2])) || 0) + '</span> ');
        if (Profile.goods[CurrentEraID-1])
            content.push('<span class="current">' + HTML.Format(parseInt(parseInt(Profile.goods[CurrentEraID-1])) || 0) + '</span> ');
        if (Profile.goods[CurrentEraID])
            content.push('<span class="next">' + HTML.Format(parseInt(parseInt(Profile.goods[CurrentEraID])) || 0) + '</span> ');
        if (Profile.guildGoods)
            content.push('<span class="guild">' + HTML.Format(parseInt(parseInt(Profile.guildGoods)) || 0) + '</span>')
        content.push('</div>');
        content.push('</div>');
        console.log(GoodsData, GoodsList, ResourceStock);

        // center content
        content.push('<div class="battleBoosts pad text-center">');
        content.push('<h2>'+i18n('Boxes.PlayerProfile.BattleBoosts')+'</h2>');
        content.push('<table><tr class="general">'
            +'<td><span class="aAtt">'+HTML.Format(parseInt(Boosts.Sums["att_boost_attacker"]))+'</span>'
            +'<span class="aDef">'+HTML.Format(parseInt(Boosts.Sums.def_boost_attacker))+'</span></td>'
            +'<td></td><td><span class="dAtt">'+HTML.Format(parseInt(Boosts.Sums.att_boost_defender))+'</span>'
            +'<span class="dDef">'+HTML.Format(parseInt(Boosts.Sums.def_boost_defender))+'</span></td></tr>');
        content.push('<tr>'
            +'<td><span class="aAtt">'+HTML.Format(parseInt(Boosts.Sums['battleground-att_boost_attacker']+Boosts.Sums.att_boost_attacker))+'</span>'
            +'<span class="aDef">'+HTML.Format(parseInt(Boosts.Sums['battleground-def_boost_attacker']+Boosts.Sums.def_boost_attacker))+'</span></td>'
            +'<td><span class="gbg"></span></td><td><span class="dAtt">'+HTML.Format(parseInt(Boosts.Sums['battleground-att_boost_defender']+Boosts.Sums.att_boost_defender))+'</span>'
            +'<span class="dDef">'+HTML.Format(parseInt(Boosts.Sums['battleground-def_boost_defender']+Boosts.Sums.def_boost_defender))+'</span></td></tr>');
        content.push('<tr>'
            +'<td><span class="aAtt">'+HTML.Format(parseInt(Boosts.Sums['guild_expedition-att_boost_attacker']+Boosts.Sums.att_boost_attacker))+'</span>'
            +'<span class="aDef">'+HTML.Format(parseInt(Boosts.Sums['guild_expedition-def_boost_attacker']+Boosts.Sums.def_boost_attacker))+'</span></td>'
            +'<td><span class="ge"></span></td><td><span class="dAtt">'+HTML.Format(parseInt(Boosts.Sums['guild_expedition-att_boost_defender']+Boosts.Sums.att_boost_defender))+'</span>'
            +'<span class="dDef">'+HTML.Format(parseInt(Boosts.Sums['guild_expedition-def_boost_defender']+Boosts.Sums.def_boost_defender))+'</span></td></tr>');
        content.push('<tr><td><span class="aAtt">'+HTML.Format(parseInt(Boosts.noSettlement['guild_raids-att_boost_attacker']))+'</span><span class="aDef">'+HTML.Format(parseInt(Boosts.noSettlement['guild_raids-def_boost_attacker']))+'</span></td><td><span class="qi"></span></td><td><span class="dAtt">'+HTML.Format(parseInt(Boosts.noSettlement['guild_raids-att_boost_defender']))+'</span><span class="dDef">'+HTML.Format(parseInt(Boosts.noSettlement['guild_raids-def_boost_defender']))+'</span></td></tr>');
        content.push('</tr></table>');
        content.push('</div>');

        if (Profile.settlements.length > 0) {
            content.push('<div class="settlements pad showMore text-center">');
            content.push('<h2>'+i18n('Boxes.PlayerProfile.Settlements')+'</h2>');
            for (let settlement of Profile.settlements) {
                content.push('<span class="'+settlement.id+'" data-original-title="'+settlement.name+'">');
                content.push('<img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_${settlement.id}.png`,true)+'" />')
                content.push(HTML.Format(parseInt(settlement.currentLevel.progress)) + '</span>');
            }
            content.push('</div>');
        }

        content.push('<div class="achievements pad showMore text-center">');
        content.push('<h2>Achievements</h2>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_great_commander.png`,true)+'" />'+
            HTML.Format(parseInt(Profile.achievements.find(x => x.id == "battle").achievements.find(x => x.id == "great_commander").currentLevel.progress)) + '</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_great_wall_of_china.png`,true)+'" />'+
            HTML.Format(parseInt(Profile.achievements.find(x => x.id == "battle").achievements.find(x => x.id == "great_wall_of_china").currentLevel.progress)) + '</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_billy_the_kid.png`,true)+'" />'+
            HTML.Format(parseInt(Profile.achievements.find(x => x.id == "battle").achievements.find(x => x.id == "billy_the_kid").currentLevel.progress)) + '</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_impressive_defender.png`,true)+'" />'+
            HTML.Format(parseInt(Profile.achievements.find(x => x.id == "guild_expedition").achievements.find(x => x.id == "impressive_defender").currentLevel.progress)) + '</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_hey_big_spender.png`,true)+'" />'+
            HTML.Format(parseInt(Profile.achievements.find(x => x.id == "resource").achievements.find(x => x.id == "hey_big_spender").currentLevel.progress)) + '</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_a_little_help_for_your_friends.png`,true)+'" />'+
            HTML.Format(parseInt(Profile.achievements.find(x => x.id == "social").achievements.find(x => x.id == "a_little_help_for_your_friends").currentLevel.progress)) + '</span>');
            content.push('<span><img src="'+srcLinks.get(`/shared/icons/achievements/achievement_icons_one_of_many_faces.png`,true)+'" />'+
            HTML.Format(parseInt(Profile.achievements.find(x => x.id == "friends_tavern").achievements.find(x => x.id == "one_of_many_faces").currentLevel.progress)) + '</span>');
        content.push('</div>');

        let moreActive = $('#PlayerProfileBody .toggleMore.active').length > 0;
        content.push(`<span class="toggleMore${moreActive?" active":""}">&nbsp;</span>`);

        $('#PlayerProfileBody').html(content.join('')).promise().done(function(){
            $('#PlayerProfileBody [data-original-title]').tooltip();
            if (isRebuild) {
                if (moreActive) { 
                    $('#PlayerProfileBody .showMore').show();
                    $('#PlayerProfileBody .hideOnMore').hide();
                }
                return
            }
            $('#PlayerProfileBody').on('click', '.toggleMore', function () {
                $(this).toggleClass('active');
                $('#PlayerProfileBody .showMore').slideToggle();
                $('#PlayerProfileBody .hideOnMore').slideToggle();
            });
        });
    }
}