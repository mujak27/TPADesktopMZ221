import { IonList, IonListHeader } from '@ionic/react';
import { nanoid } from 'nanoid';
import React from 'react';
import { useGlobalContext } from '../../../../context/ContextProvider';
import { useBoardContext } from '../../BoardContext';
import { BoardMemberItem } from './BoardMemberItem';

type props = {

}

export const BoardMemberManage : React.FC<props> = ({})=>{
  const {user} = useGlobalContext();
  const {board} = useBoardContext();

  return (
    <>
      <IonListHeader>
        <>Mange existing member</>
      </IonListHeader>
      <IonList>
        {
          board.boardMembers.map((boardMember)=>{
            if (boardMember == user.userUid) return null;
            return (<BoardMemberItem key={nanoid()} memberUid={boardMember} />);
          })
        }
      </IonList>
    </>
  );
};
